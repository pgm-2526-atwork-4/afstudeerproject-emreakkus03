import { Client, Account, Databases, Teams } from "appwrite";

const client = new Client()

client
    .setEndpoint(process.env.REACT_APP_APPWRITE_ENDPOINT || "localhost/v1")
    .setProject(process.env.REACT_APP_APPWRITE_PROJECT_ID || "default_project_id"); 

export const account = new Account(client);
export const databases = new Databases(client);
export const teams = new Teams(client);

export default client;