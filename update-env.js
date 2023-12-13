const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rootPath = __dirname;

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

const sequelizeFilePaths = [
  'apps/node/tasks-apis/.sequelizerc',
  'apps/node/project-documents-api/.sequelizerc',
  'apps/node/main-apis/.sequelizerc',
  'apps/node/leave-apis/.sequelizerc',
];

const environmentFilePaths = [
  'apps/node/main-apis/src/enviornment.ts',
  'apps/node/leave-apis/src/enviornment.ts',
  'apps/node/project-documents-api/src/enviornment.ts',
  'apps/node/tasks-apis/src/enviornment.ts',
  'libs/auth/user-authentication/src/enviornment.ts',
  'libs/preference/src/enviornment.ts',
  'libs/site-settings/site-settings/src/enviornment.ts',
];

const updateFileOptions = [
  { id: 1, file: 'environment' },
  { id: 2, file: 'sequelize' },
];

const environmentOptions = [
  { id: 1, env: 'development' },
  { id: 2, env: 'staging' },
  { id: 3, env: 'production' },
];

function displayOptions(options, label) {
  console.log(GREEN + `Please select a ${label}:`);
  options.forEach((option, index) => {
    console.log(RESET + `${index + 1}. ${option}`);
  });
}

async function getUserInput(prompt) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(prompt, (choice) => {
      rl.close();
      resolve(choice);
    });
  });
}

function executeAction(fileOption, envOption) {
  const filePaths = fileOption.id === 1 ? environmentFilePaths : sequelizeFilePaths;
  const searchPattern = fileOption.id === 1 ? /state:\s*'.*?'/g : /env:\s*'.*?'/g;
  const replacement = fileOption.id === 1 ? `state: '${envOption.env}'` : `env: '${envOption.env}'`;

  updateFiles(filePaths, searchPattern, replacement);
  const fileType = fileOption.id === 1 ? 'State' : 'sequelizerc env';
  console.log(YELLOW + '=======================================================');
  console.log(GREEN + `${fileType} updated successfully to '${envOption.env}'!`);
  console.log(YELLOW + '=======================================================');
}

function updateFiles(filePaths, searchPattern, replacement) {
  filePaths.forEach((filePath) => {
    const fullPath = path.join(rootPath, filePath);
    const fileContent = fs.readFileSync(fullPath, 'utf8');
    const updatedContent = fileContent.replace(searchPattern, replacement);
    fs.writeFileSync(fullPath, updatedContent, 'utf8');
  });
}

async function main() {
  while (true) {
    displayOptions(
      updateFileOptions.map((option) => option.file),
      'file'
    );
    const choice = await getUserInput('Enter your choice (1 | 2): ');
    const selectedFileOption = updateFileOptions[parseInt(choice) - 1];

    if (!selectedFileOption) {
      console.log(RED + 'Invalid file option. Please try again.');
      continue;
    }
    console.log(YELLOW + '-------------------------------------------------------');
    console.log(GREEN + `You have selected file: ${selectedFileOption.file}`);
    console.log(YELLOW + '-------------------------------------------------------');
    displayOptions(
      environmentOptions.map((option) => option.env),
      'environment state'
    );
    const envChoice = await getUserInput('Enter your choice (1 | 2 | 3): ');
    const selectedEnvOption = environmentOptions[parseInt(envChoice) - 1];

    if (!selectedEnvOption) {
      console.log(RED + 'Invalid environment choice. Please try again.');
      continue;
    }
    console.log(YELLOW + '-------------------------------------------------------');
    console.log(GREEN + `You have selected environment state: ${selectedEnvOption.env}`);
    console.log(YELLOW + '-------------------------------------------------------');
    executeAction(selectedFileOption, selectedEnvOption);
    process.exit(); // Terminate the program
  }
}

main();
