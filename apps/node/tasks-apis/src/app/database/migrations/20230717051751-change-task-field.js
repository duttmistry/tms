'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('tm_tasks','assignee',{
      type: Sequelize.INTEGER,
      allowNull:true
    })
    await queryInterface.changeColumn('tm_tasks','description',{
      type: Sequelize.TEXT('long'),
      allowNull:true
    })
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
