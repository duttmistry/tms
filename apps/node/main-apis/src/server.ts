import SampleRoute from './app/api/sample/sample.route';
import UserRoute from './app/api/user/user.route';
import HolidayRoute from './app/api/holiday/holiday.route';
import CmsRoute from './app/api/cms/cms.route';
import SpecialdaysRoute from './app/api/specialdays/specialdays.route';
import App from './main';
import WorkspaceRoute from './app/api/workspace/workspace.route';
import SiteSettingRoute from './app/api/site_setting/site_setting.route';
import ProjectRoute from './app/api/project/project.route';
import CustomFieldsRoute from './app/api/custom_fields/custom_fields.route';
import TagRoute from './app/api/tag/tag.route';
import ProjectStatus from './app/api/project_status/project_status.route';
import PreferenceRoute from './app/api/preference/preference.route';
import AdministrationRoute from './app/api/administration/administration.route';
import WorkflowRoute from './app/api/workflow/workflow.route';
import HelpsRoutes from './app/api/helps/helps';
import Admincharts from './app/api/admincharts/admincharts.route';

const app = new App([
  new SampleRoute(),
  new UserRoute(),
  new HolidayRoute(),
  new CmsRoute(),
  new WorkspaceRoute(),
  new SiteSettingRoute(),
  new ProjectRoute(),
  new SpecialdaysRoute(),
  new CustomFieldsRoute(),
  new TagRoute(),
  new ProjectStatus(),
  new PreferenceRoute(),
  new AdministrationRoute(),
  new WorkflowRoute(),
  new HelpsRoutes(),
  new Admincharts()
]);

app.listen();
