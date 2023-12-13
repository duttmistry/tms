import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { iTasks } from '../interface/task.interface';

import { Task_Type_Enum, Task_State_Enum, Task_Prioriry_Enum, Task_Running_Status_Enum } from '@tms-workspace/enum-data';

export type TaskCreationAttributes = Optional<iTasks, 'title'>;

export class TaskModel extends Model<iTasks, TaskCreationAttributes> implements iTasks {
  public parent_task_id: number;
  public project_id: number;
  public task_key: string;
  public task_unique_key:string;
  public external_link:string;
  public task_key_prefix: string;
  public total_worked_hours:string;
  public type: Task_Type_Enum;
  public title: string;
  public description: string;
  public state: Task_State_Enum;
  public status: number;
  public section:number
  public assignee: number;
  public assigned_by: number;
  public reporter: number;
  public labels: Array<number>;
  public documents: Array<string>;
  public start_date: Date;
  public due_date: Date;
  public priority: Task_Prioriry_Enum | null; 
  public running_status: Task_Running_Status_Enum;
  public eta: string;
  public subscribers: Array<number>;
  public created_by?: number;
  public updated_by?: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date;
}

export default function (sequelize: Sequelize): typeof TaskModel {
  TaskModel.init(
    {
      id: {
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      parent_task_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: {
            tableName: 'tm_tasks',
          },
          key: 'id',
        },
      },
      project_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: {
            tableName: 'tm_projects',
          },
          key: 'id',
        },
      },
      task_key: {
        type: DataTypes.STRING(128),
        // get() {
        //   // Automatically concatenate prefix and uniqe_id
        //   return this.getDataValue('task_key_prefix') + this.getDataValue('task_unique_key');
        // }
      },
      total_worked_hours:{
        type: DataTypes.STRING(128),
        allowNull: true,
      },
      external_link:{
        type: DataTypes.STRING(128),
        allowNull: true,
      },
      // task_key: {
      //   type: DataTypes.STRING(128),
      //   allowNull: true,
      // },
      task_unique_key:{
        type: DataTypes.STRING(64),
        allowNull: true,
      },
      task_key_prefix:{
        type: DataTypes.STRING(64),
        allowNull: true,
      },
      type: {
        type: DataTypes.ENUM('Epic', 'Bug', 'Task'),
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(512),
        allowNull: false,
      },
      description: {
        type:DataTypes.TEXT('long'),
        allowNull: true,
      },
      state: {
        type: DataTypes.ENUM('todo', 'inprogress', 'onhold', 'completed'),
        allowNull: false,
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: {
            tableName: 'tm_project_status',
          },
          key: 'id',
        },
      },
      section: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: {
            tableName: 'tm_tasks_sections',
          },
          key: 'id',
        },
      },
      assignee: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: {
            tableName: 'tm_users',
          },
          key: 'id',
        },
      },
      assigned_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: {
            tableName: 'tm_users',
          },
          key: 'id',
        },
      },
      reporter: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: {
            tableName: 'tm_users',
          },
          key: 'id',
        },
      },
      labels: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      documents: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      start_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      due_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      priority: {
        type: DataTypes.ENUM('Urgent', 'High', 'Normal', 'Low'),
        allowNull: true,
      },
      running_status: {
        type: DataTypes.ENUM('Ongoing', 'Stop', 'Not Started Yet'),
        allowNull: false,
      },
      eta: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
      subscribers: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: {
            tableName: 'tm_users',
          },
          key: 'id',
        },
      },
      updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: {
            tableName: 'tm_users',
          },
          key: 'id',
        },
      },
    },
    {
      tableName: 'tm_tasks',
      sequelize,
      // paranoid: true,
      hooks:{
        beforeFind: (model) => {
        model.attributes = {
          exclude: [],
        };
      },},
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );
  
  return TaskModel;
}
