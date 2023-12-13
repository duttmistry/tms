'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tm_user_logs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      user_id: {
        type: Sequelize.INTEGER,
      },
      action: {
        type: Sequelize.STRING(16),
        allowNull: false
      },
      action_start_date: {
        type: Sequelize.DATE,
      },
      action_end_date: {
        type: Sequelize.DATE,
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
      login_capture_data: {
        type: Sequelize.JSON,
      },
      logout_capture_data: {
        type: Sequelize.JSON,
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
    await queryInterface.dropTable('tm_user_logs');
  },
};
