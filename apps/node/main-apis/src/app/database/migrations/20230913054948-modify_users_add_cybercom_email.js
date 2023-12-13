'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
   
     queryInterface.addColumn(
        'tm_users', // table name
        'cybercom_email', // new field name
        {
          type: Sequelize.STRING,
     
        },
     );
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
