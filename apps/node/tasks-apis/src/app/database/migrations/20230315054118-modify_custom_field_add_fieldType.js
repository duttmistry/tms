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
          'tm_custom_fields', // table name
          'fieldType', // new field name
          {
            type: Sequelize.STRING(64),
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
