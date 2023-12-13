const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

// Command line argument for the desired environment
const args = process.argv.slice(2);
const environment = args[0];

//constant variables
const _angularProdFilePath = 'apps/angular/main-app/src/environments/environment.ts';
const npmCommands = [
  'npx nx run node-main-apis:build',
  'npx nx run node-leave-apis:build',
  'npx nx run node-project-documents-api:build',
  'npx nx run node-tasks-apis:build',
  'npx nx run angular-main-app:build',
]; // COMMANDS
const searchDirectories = ['apps', 'libs']; // Directories to search for environment.ts files
const STAGING_APIS_PATH = {
  base_url: 'http://192.168.0.204:3002/',
  document_base_url: 'http://192.168.0.204:3003/',
  leave_base_url: 'http://192.168.0.204:3004/',
  task_base_url: 'http://192.168.0.204:3005/',
};
const DEVELOPMENT_APIS_PATH = {
  base_url: 'http://192.168.0.204:3500/',
  document_base_url: 'http://192.168.0.204:3501/',
  leave_base_url: 'http://192.168.0.204:3502/',
  task_base_url: 'http://192.168.0.204:3503/',
};
const PRODUCTION_APIS_PATH = {
  base_url: 'https://tms-production-core-apis.cybercom.in/',
  document_base_url: 'https://tms-production-document-apis.cybercom.in/',
  leave_base_url: 'https://tms-production-leave-apis.cybercom.in/',
  task_base_url: 'https://tms-production-task-apis.cybercom.in/',
};

if (!environment) {
  console.error('Please provide an environment (--env) e.g., --env staging');
  process.exit(1);
}

// Find environment.ts files in specified directories
const environmentFiles = findEnvironmentFilesInDirectories(searchDirectories);

// Function to find all environment.ts files recursively in specified directories
function findEnvironmentFilesInDirectories(directories, fileList = []) {
  directories.forEach((directory) => {
    const files = fs.readdirSync(directory);

    files.forEach((file) => {
      const filePath = path.join(directory, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        // Recursively search in subdirectories
        findEnvironmentFilesInDirectories([filePath], fileList);
      } else if (file === 'enviornment.ts') {
        fileList.push(filePath);
      }
    });
  });

  return fileList;
}

// Function to update the environment files
function updateEnvironmentFiles() {
  environmentFiles.forEach((filePath) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error(`Error reading ${filePath}: ${err}`);
        process.exit(1);
      }

      let updatedData = data;

      if (!/state: '[^']+'/.test(data)) {
        // If 'state' property is not found in the file, add it
        updatedData += "\nexport default {\n  state: 'development',\n};\n";
      }

      updatedData = updatedData.replace(/state: '[^']+'/g, `state: '${environment}'`);

      fs.writeFile(filePath, updatedData, 'utf8', (err) => {
        if (err) {
          console.error(`Error writing to ${filePath}: ${err}`);
          process.exit(1);
        }
        console.log(`Updated ${filePath} with environment: ${environment}`);
      });
    });
  });
}

// Function to update environment.prod.ts file
function updateAngularEnvironmentProdFile() {
  const prodFilePath = _angularProdFilePath; // Specify the path to your environment.prod.ts file

  fs.readFile(prodFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error(`Error reading ${prodFilePath}: ${err}`);
      process.exit(1);
    }

    // Uncomment the appropriate section based on the provided environment
    const uncommentedData = data.replace(new RegExp(`\\/\\*\\*\\s+${environment.toUpperCase()}\\s+\\*\\/`, 'g'), '');

    // Update the base_url parameter using regular expressions
    // let updatedData;

    // Update properties using regular expressions
    let updatedData = uncommentedData;

    if (environment == 'staging') {
      for (const key in STAGING_APIS_PATH) {
        if (STAGING_APIS_PATH.hasOwnProperty(key)) {
          const regex = new RegExp(`${key}: '[^']+'`, 'g');
          updatedData = updatedData.replace(regex, `${key}: '${STAGING_APIS_PATH[key]}'`);
        }
      }
    } else if (environment == 'production') {
      for (const key in PRODUCTION_APIS_PATH) {
        if (PRODUCTION_APIS_PATH.hasOwnProperty(key)) {
          const regex = new RegExp(`${key}: '[^']+'`, 'g');
          updatedData = updatedData.replace(regex, `${key}: '${PRODUCTION_APIS_PATH[key]}'`);
        }
      }
    } else {
      // development env
      for (const key in DEVELOPMENT_APIS_PATH) {
        if (DEVELOPMENT_APIS_PATH.hasOwnProperty(key)) {
          const regex = new RegExp(`${key}: '[^']+'`, 'g');
          updatedData = updatedData.replace(regex, `${key}: '${DEVELOPMENT_APIS_PATH[key]}'`);
        }
      }
    }
    //const updatedData = uncommentedData.replace(/base_url: '[^']+'/g, `base_url: 'new_base_url_value'`);

    fs.writeFile(prodFilePath, updatedData, 'utf8', (err) => {
      if (err) {
        console.error(`Error writing to ${prodFilePath}: ${err}`);
        process.exit(1);
      }
      console.log(`Updated ${prodFilePath} with new base_url.`);
    });
  });
}

// Run npm scripts
function runNpmScripts() {
  let currentIndex = 0;
  function runNextScript() {
    if (currentIndex < npmCommands.length) {
      console.log(`Running: ${npmCommands[currentIndex]}`);
      const childProcess = exec(npmCommands[currentIndex]);

      childProcess.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
      });

      childProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
      });

      childProcess.on('close', (code) => {
        if (code === 0) {
          console.log(`Success: ${npmCommands[currentIndex]}`);
          currentIndex++;
          runNextScript();
        } else {
          console.error(`Error running ${npmCommands[currentIndex]}`);
          process.exit(1);
        }
      });
    } else {
      console.log('All npm scripts completed successfully.');
      process.exit(0); // Exit with a success code (0)
    }
  }

  runNextScript();
}

// Update environment files and then run npm scripts
updateEnvironmentFiles();
updateAngularEnvironmentProdFile();
runNpmScripts();
