# CivicSnap - Dashboard Platform

The CivicSnap Dashboard is the central control hub for municipalities and administrators. The platform provides the necessary tools to efficiently handle citizen reports and manage app content.

## 📦 Installation

1. Navigate to the folder: `cd civicsnap-dashboard`
2. Install the dependencies: `npm install`
3. Start the development environment: `npm start`

## 🏛️ Functionalities

### City Dashboard (For Officials)

- **Report Management:** View incoming reports on a map or in a list. Change the status (e.g., "In Progress" or "Resolved") and communicate directly with the citizen.
- **Announcements:** Send important updates or news items directly to the mobile app of citizens in your region.

### Super Admin Dashboard

- **System Management:** Full overview of all connected municipalities and users.
- **Rewards Management:** Manage the products and vouchers available in the mobile app's in-app shop.
- **Moderation:** Access to the Shadowban feature to prevent platform abuse. *(Note: This feature is currently under development).*

## 🛠 Tech Stack

- **Framework:** React.js
- **Language:** TypeScript (TSX)
- **Styling:** Tailwind CSS
- **Backend Integration:** Appwrite SDK
- **Internationalization:** i18next (focus on nl-BE)
- **Icons:** Lucide React

## 👤 Author

Emre Akkus