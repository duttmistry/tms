'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tm_holidays', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      title: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
      holiday_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      // short_description: {
      //   type: Sequelize.STRING(64),
      //   allowNull: true,
      // },
      // from_date: {
      //   type: Sequelize.DATE,
      //   allowNull: false,
      // },
      // to_date: {
      //   type: Sequelize.DATE,
      //   allowNull: false,
      // },
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
    await queryInterface.dropTable('tm_holidays');
  },
};
