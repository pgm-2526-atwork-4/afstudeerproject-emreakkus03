import { Client, Databases, Query } from 'node-appwrite';

// Mathematical formula to calculate distance in meters between 2 GPS coordinates
function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Radius of the Earth in meters
  const p = Math.PI / 180;
  const a = 0.5 - Math.cos((lat2 - lat1) * p) / 2 + 
        Math.cos(lat1 * p) * Math.cos(lat2 * p) * (1 - Math.cos((lon2 - lon1) * p)) / 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

// Helper functie om te kijken hoeveel woorden twee lijsten gemeen hebben
function calculateLabelOverlap(labels1, labels2) {
  if (!labels1 || !labels2 || !Array.isArray(labels1) || !Array.isArray(labels2)) return 0;
  // Maak een set voor snelle vergelijking
  const set2 = new Set(labels2);
  // Filter de woorden uit array 1 die ook in array 2 staan
  const intersection = labels1.filter(label => set2.has(label));
  return intersection.length;
}

export default async ({ req, res, log, error }) => {
  // Check if the function was triggered by a database event
  if (!req.body) {
    return res.send("Function called directly, no database payload found.");
  }

  const newReport = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  
  // If this report already has an original_id, stop (prevents infinite loops)
  if (newReport.original_report_id) {
    return res.json({ success: true, message: "Report is already linked." });
  }

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);

  const databaseId = process.env.DATABASE_ID;
  const collectionId = process.env.REPORTS_COLLECTION_ID;

  try {
    log(`Searching for duplicates for report ${newReport.$id} in category ${newReport.category_id}`);

    // 1. Search for other active reports with the EXACT same category and organization
    const existingReports = await databases.listDocuments(
      databaseId,
      collectionId,
      [
        Query.equal('organization_id', newReport.organization_id),
        Query.equal('category_id', newReport.category_id),
        Query.equal('status', ['new', 'approved', 'in_progress']),
        Query.notEqual('$id', newReport.$id), // Ignore itself
        Query.isNull('original_report_id')    // Compare only with "main" reports
      ]
    );

    let foundOriginalId = null;

    // 2. Loop through the results and check GPS distance & AI labels
    for (const report of existingReports.documents) {
      const distance = getDistanceFromLatLonInMeters(
        newReport.location_lat, 
        newReport.location_long, 
        report.location_lat, 
        report.location_long
      );

      log(`Distance to ${report.$id}: ${Math.round(distance)} meters`);

      // 3. De 50-meter check is gehaald
      if (distance <= 50) {
        
        const newLabels = newReport.vision_labels || [];
        const oldLabels = report.vision_labels || [];

        // BEIDE meldingen hebben foto-labels (We gaan slim checken!)
        if (newLabels.length > 0 && oldLabels.length > 0) {
          const sharedWordsCount = calculateLabelOverlap(newLabels, oldLabels);
          log(`Shared AI labels with ${report.$id}: ${sharedWordsCount} words`);

          // Ze moeten minstens 2 dezelfde labels hebben (bijv: "couch" & "furniture")
          if (sharedWordsCount >= 2) {
             foundOriginalId = report.$id;
             log(`AI MATCH! Original ID becomes: ${foundOriginalId}`);
             break; // Stop met zoeken, we hebben hem!
          } else {
             log(`No AI Match. These are different objects in the same area.`);
             // We doen hier expres GEEN break. Misschien ligt de échte duplicate wel verderop in de lijst!
          }
        } 
        // Eén van de twee (of allebei) heeft GEEN foto. We vertrouwen alleen op GPS.
        else {
          foundOriginalId = report.$id;
          log(`GPS MATCH (No AI data available). Original ID becomes: ${foundOriginalId}`);
          break; // Stop met zoeken
        }
      }
    }

    // 4. If we found a match, update the NEW report with the ID of the OLD report
    if (foundOriginalId) {
      await databases.updateDocument(
        databaseId,
        collectionId,
        newReport.$id,
        {
          original_report_id: foundOriginalId,
          is_duplicate: true
        }
      );
      return res.json({ success: true, message: `Duplicate successfully linked to ${foundOriginalId}` });
    }

    return res.json({ success: true, message: "No duplicates found. This is a unique report." });

  } catch (err) {
    error(`Error during duplicate check: ${err.message}`);
    return res.json({ success: false, error: err.message });
  }
};