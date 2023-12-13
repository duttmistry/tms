'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tm_leave_opening_balance', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
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
        allowNull: true,
      },
      opening_balance: {
        type: Sequelize.FLOAT,
      },
      closing_balance: {
        type: Sequelize.FLOAT,
      },
      month: {
        type: Sequelize.STRING(9),
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
    await queryInterface.dropTable('tm_leave_opening_balance');
  }
};