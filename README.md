To access deployed webpage, please follow this URL:
https://driveit.fly.dev/

This README provides detailed instructions for installing PostgreSQL, setting up the database, and running the application locally on Mac and Windows systems. Follow the steps below based on your operating system.

## Prerequisites

- Node.js installed on your system. [Download here](https://nodejs.org/).
- Basic knowledge of navigating through the terminal/command prompt.
- Access to the `setup.sql` file and `env.json` file provided by the project.

---

## Installation

### Mac Installation

1. **Install PostgreSQL:**
   - Open your terminal.
   - Install PostgreSQL using **Homebrew**:
     ```
     brew install postgresql
     ```
   - Once installed, start the PostgreSQL service:
     ```
     brew services start postgresql
     ```

2. **Verify Installation:**
   - Run the following command to confirm PostgreSQL is installed:
     ```
     psql --version
     ```

3. **Create a PostgreSQL User:**
   - Switch to the PostgreSQL interface:
     ```
     psql postgres
     ```
   - Create a user with a password:
     ```
     CREATE USER your_username WITH PASSWORD 'your_password';
     ALTER USER your_username CREATEDB;
     ```
   - Exit PostgreSQL:
     ```
     \q
     ```

---

### Windows Installation

1. **Download and Install PostgreSQL:**
   - Go to the [PostgreSQL official website](https://www.postgresql.org/download/).
   - Download and run the installer for Windows.
   - During installation:
     - Set a **username** (e.g., `postgres`) and a **password**.
     - Ensure that the "pgAdmin 4" component is selected.
   - Complete the installation.

2. **Add PostgreSQL to PATH:**
   - Search for "Environment Variables" in the Windows search bar.
   - Under "System Variables," find `Path`, click **Edit**, and add the path to the PostgreSQL `bin` folder (e.g., `C:\Program Files\PostgreSQL\<version>\bin`).

3. **Verify Installation:**
   - Open a command prompt and run:
     ```
     psql --version
     ```

4. **Create a PostgreSQL User:**
   - Open **pgAdmin 4** or use the command prompt:
     ```
     psql -U postgres
     ```
   - Create a new user with a password:
     ```
     CREATE USER your_username WITH PASSWORD 'your_password';
     ALTER USER your_username CREATEDB;
     ```
   - Exit PostgreSQL:
     ```
     \q
     ```

---

## Database Setup

## Application Setup

1. **Configure the `env.json` File:**
   - Open the `env.json` file in a text editor.
   - Ensure the following configuration matches your PostgreSQL setup:
     {
       "user": "your_username",
       "database": "driveit",
       "password": "your_password"
       "api_key": GET API KEY FROM EMAIL
     }

2. **Install Node.js Dependencies:**
   - Navigate to the base directory of the project:
     ```
     cd /path/to/project
     ```
   - Install dependencies:
     ```
     npm install
     ```

3. **Launch PostgreSQL with Setup Script:**
   - Mac & Windows: Use the terminal:
     ```
     npm run start:local
     ```
---

---

## Running the Application Locally

1. **Start the Server:**
   - From the base directory, run:
     ```
     node app/server.json
     ```

2. **Access the Webpage:**
   - Open your browser and navigate to:
     ```
     http://localhost:8080
     ```

---
