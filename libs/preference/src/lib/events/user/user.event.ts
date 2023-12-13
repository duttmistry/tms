import { EventEmitter } from 'events';
import UserService from '../../services/user.service';
import TaskService from '../../services/task.service';
import { IProject } from '../../database/interface/user.interface';
import { Op } from 'sequelize';
const eventEmitterTask = new EventEmitter();
const userService = new UserService();
const taskService = new TaskService();

eventEmitterTask.on('exemployee_remove_from_workspace_project_tasks', async (user_id: string) => {
  try {
    console.log(user_id, 'user_id ||||||||||||||||||||||||| exemployee_remove_from_workspace_project_tasks');

    // get User Data Based on Employee Id

    const user = await userService._getUserDataById(user_id);
    const usersData = await userService._getUsers(user_id);

    const userTmsId = user.id;

    const getWorkspaceData = await userService._getUserWorkspaces(userTmsId);
    // console.log(getWorkspaceData, 'WorkSpace Data');

    const getProjectData = await userService._getUserProjects(userTmsId);
    // console.log(getProjectData, 'Project Data');

    // console.log(user, 'USER DATA');

    for (const user of usersData) {
      // Update user Data
      user.team_lead = user.team_lead === user_id ? null : user.team_lead;
      user.project_manager = user.project_manager === user_id ? null : user.project_manager;

      await userService._updateUsers(user);
    }

    for (const workspace of getWorkspaceData) {
      console.log(workspace, 'workspace');

      // Update workspace Data

      workspace.responsible_person = workspace.responsible_person === userTmsId ? null : workspace.responsible_person;

      const newWorkspaceTeam = workspace.team.map((team) => {
        const teamReport_to = team.report_to.find((id) => id === userTmsId) ? team.report_to.filter((item) => item !== userTmsId) : team.report_to;

        return {
          id: team.id,
          user_id: team.user_id,
          report_to: teamReport_to,
          workspace_id: team.workspace_id,
        };
      });

      await userService._updateWorkspaceTeam(newWorkspaceTeam);

      await userService._deleteWorkspaceTeam({ user_id: userTmsId, workspace_id: workspace.id });

      await userService._updateWorkspaces(workspace);
    }

    for (const project of getProjectData) {
      console.log(project, 'project');

      // Update project Data

      project.responsible_person = project.responsible_person === userTmsId ? null : project.responsible_person;

      const newProjectTeam = project.projectTeam.map((team) => {
        const teamReport_to = team.report_to.find((id) => id === userTmsId) ? team.report_to.filter((item) => item !== userTmsId) : team.report_to;

        return {
          id: team.id,
          user_id: team.user_id,
          report_to: teamReport_to,
          project_id: team.project_id,
        };
      });

      await userService._updateProjectTeam(newProjectTeam);

      await userService._deleteProjectTeam({ user_id: userTmsId, project_id: project.id });

      await userService._updateProjects(project);

      let tasklist = await taskService._getTasks({
        [Op.and]: [
          {
            [Op.or]: [{ assignee: userTmsId }, { assigned_by: userTmsId }, { reporter: userTmsId }],
          },
          {
            project_id: project.id,
          },
          {
            state: { [Op.ne]: 'completed' },
          },
        ],
      });
      tasklist = JSON.parse(JSON.stringify(tasklist));
      console.log(tasklist, 'tasklist');

      for (const task of tasklist) {
        const assignee = task.assignee == userTmsId ? { assignee: null } : {};
        const assigned_by = task.assigned_by == userTmsId ? { assigned_by: null } : {};
        const reporter = task.reporter == userTmsId ? { reporter: null } : {};
        await taskService._updateTaskTime({ user_id: userTmsId, end_time: null, task_id: task.id }, { $set: { end_time: Date.now() } });
        await taskService._updateTaskStatus({ running_status: 'Stop' }, { user_id: userTmsId, task_id: task.id });
        const data = await taskService._getTaskHistoryData({ task_id: task.id });
        const currentTime = new Date();

        let totalMilliseconds = 0;
        for (const entry of data) {
          if (entry.end_time === null) {
            const startTime = new Date(entry.start_time);
            totalMilliseconds += currentTime.getTime() - startTime.getTime();
          } else {
            const startTime = new Date(entry.start_time);
            const endTime = new Date(entry.end_time);
            totalMilliseconds += endTime.getTime() - startTime.getTime();
          }
        }

        const totalSeconds = Math.floor(totalMilliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        await taskService._updateTasks(
          {
            ...assignee,
            ...assigned_by,
            ...reporter,
            total_worked_hours: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
          },
          { id: task.id }
        );
      }
    }
  } catch (error) {
    console.log('error', error);
  }
});

export default eventEmitterTask;
