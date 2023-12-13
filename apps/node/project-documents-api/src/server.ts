import ProjectDocumentsRoute from './app/api/project_documents/project_documents.route';
import App from './main';

const app = new App([new ProjectDocumentsRoute()]);

app.listen();
