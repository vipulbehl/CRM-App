
# CRM-App

CRM application is built on the Node.js platform, leveraging the power of Google Sheets as a flexible and scalable backend database. This innovative solution aims to streamline and enhance customer interactions, providing businesses with a robust tool to manage, analyze, and optimize their relationships with clients.


## Features

- Utilize the familiarity and accessibility of Google Sheets as the primary backend database.
- Seamlessly sync data between the Node.js application and Google Sheets for real-time updates and collaboration.
- Efficiently organize and manage customer contacts with detailed profiles.
- Easily add, edit, and delete contacts, ensuring an up-to-date database.

## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

`GCLOUD_PROJECT`
`GOOGLE_APPLICATION_CREDENTIALS`
`GOOGLE_SHEET_ID`
`GOOGLE_SHEET_NAME`
`SCHEMA_SHEET_NAME`
## Run Locally
Pre-requisite
- Update the .env file with the correct Google Sheets
- Refer https://docs.google.com/spreadsheets/d/1FMyPS9jasayfPLxdX8McuB-AWMufq5bVQjNuZKqbTm4/edit?usp=sharing for details on how to setup google sheet

Clone the project

```bash
  git clone https://github.com/vipulbehl/CRM-App
```

Go to the project directory

```bash
  cd CRM-App
```

Install dependencies

```bash
  npm install
```

Start the server

```bash
  npm run start
```

# Creating a windows executable
```bash
  pkg . -t node18-win
```