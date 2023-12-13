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

    return Promise.all([
      queryInterface.addColumn(
        'tm_leave_history', // table name
        'sandwich_from_date', // new field name
        {
          type: Sequelize.DATE,
          allowNull: true,
        }
      ),

      queryInterface.addColumn(
        'tm_leave_history', // table name
        'sandwich_to_date', // new field name
        {
          type: Sequelize.DATE,
          allowNull: true,
        }
      ),
    ]);
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
