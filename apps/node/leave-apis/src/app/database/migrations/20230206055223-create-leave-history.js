'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tm_leave_history', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
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
      requested_date: {
        type: Sequelize.DATE
      },
      from_date: {
        type: Sequelize.DATE
      },
      leave_from_slot: {
        type: Sequelize.STRING(2)
      },
      to_date: {
        type: Sequelize.DATE
      },
      leave_to_slot: {
        type: Sequelize.STRING(2)
      },
      no_of_days: {
        type: Sequelize.FLOAT
      },
      leave_subject: {
        type: Sequelize.STRING(64)
      },
      description: {
        type: Sequelize.TEXT('long')
      },
      attachments: {
        type: Sequelize.JSON
      },
      status: {
        type: Sequelize.STRING(32)
      },
      approved_required_from: {
        type: Sequelize.JSON
      },
      approved_by: {
        type: Sequelize.JSON
      },
      deleted_at: {
        type: Sequelize.DATE
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('tm_leave_history');
  }
};