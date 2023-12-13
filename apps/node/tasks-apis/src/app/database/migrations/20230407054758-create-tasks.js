'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tm_tasks', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      parent_task_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: {
            tableName: 'tm_tasks',
          },
          key: 'id',
        },
      },
      project_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: {
            tableName: 'tm_projects',
          },
          key: 'id',
        },
      },
      task_key: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM('Epic', 'Bug', 'Task'),
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(512),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      state: {
        type: Sequelize.ENUM('todo', 'inprogress', 'onhold', 'completed'),
        allowNull: false,
      },
      status: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: {
            tableName: 'tm_project_status',
          },
          key: 'id',
        },
      },
      section: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: {
            tableName: 'tm_tasks_sections',
          },
          key: 'id',
        },
      },
      assignee: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: {
            tableName: 'tm_users',
          },
          key: 'id',
        },
      },
      assigned_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: {
            tableName: 'tm_users',
          },
          key: 'id',
        },
      },
      reporter: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: {
            tableName: 'tm_users',
          },
          key: 'id',
        },
      },
      labels: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      documents: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      due_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      priority: {
        type: Sequelize.ENUM('Urgent', 'High', 'Normal', 'Low'),
        allowNull: true,
      },
      running_status: {
        type: Sequelize.ENUM('Ongoing', 'Stop', 'Not Started Yet'),
        allowNull: false,
      },
      eta: {
        type: Sequelize.STRING(64),
        allowNull: true,
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: {
            tableName: 'tm_users',
          },
          key: 'id',
        },
      },
      updated_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: {
            tableName: 'tm_users',
          },
          key: 'id',
        },
      },
      deleted_at: {
        allowNull: true,
        type: Sequelize.DATE,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('tm_tasks');
  },
};
