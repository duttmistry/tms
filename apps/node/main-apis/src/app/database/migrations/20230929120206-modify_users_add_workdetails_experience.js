'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */

    queryInterface.addColumn(
      'tm_users', // table name
      'workdetails', // new field name
      {
        type: Sequelize.JSON,
      }
    );
    queryInterface.addColumn(
      'tm_users', // table name
      'experience', // new field name
      {
        type: Sequelize.JSON,
      }
    );
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
