'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tm_leave_manual_update_draft_data', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      leave_manual_log_id: {
        type: Sequelize.INTEGER,
        references: {
          model: {
            tableName: 'tm_leave_manual_updates_log',
          },
          key: 'id',
        },
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      month: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        references: {
          model: {
            tableName: 'tm_users',
          },
          key: 'id',
        },
      },

      leave_type: {
        type: Sequelize.ENUM('CL', 'PL', 'LWP'),
        allowNull: false,
      },

      leave_opening: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      leave_used: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      leave_added: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      leave_current: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      comments: {
        type: Sequelize.STRING(256),
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
        allowNull: true,
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
    await queryInterface.dropTable('tm_leave_manual_update_draft_data');
  },
};
