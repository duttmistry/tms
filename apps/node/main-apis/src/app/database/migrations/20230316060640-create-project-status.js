'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tm_project_status', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
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
      title: {
        type: Sequelize.STRING,
      },
      state: {
        type: Sequelize.ENUM('todo', 'inprogress', 'onhold', 'completed'),
        allowNull: false,
      },
      color: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      created_by: {
        type: Sequelize.INTEGER,
        references: {
          model: {
            tableName: 'tm_users',
          },
          key: 'id',
        },
      },
      updated_by: {
        type: Sequelize.INTEGER,
        references: {
          model: {
            tableName: 'tm_users',
          },
          key: 'id',
        },
      },
      deleted_at: {
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
    await queryInterface.dropTable('tm_project_status');
  }
};