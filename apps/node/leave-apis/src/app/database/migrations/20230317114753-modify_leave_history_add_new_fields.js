'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
     return Promise.all([
       queryInterface.addColumn(
         'tm_leave_history', // table name
         'leave_type', // new field name
         {
           type: Sequelize.ENUM('CL', 'PL', 'LWP'),
           allowNull: true,
         }
       ),
     ]);
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
