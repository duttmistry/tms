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
    await queryInterface.addColumn('tm_workspace', 'created_by', {
      type: Sequelize.INTEGER,
      references: {
        model: {
          tableName: 'tm_users',
        },
        key: 'id',
      },
    });
    await queryInterface.addColumn('tm_workspace', 'updated_by', {
      type: Sequelize.INTEGER,
      references: {
        model: {
          tableName: 'tm_users',
        },
        key: 'id',
      },
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('tm_workspace', 'created_by');
    await queryInterface.removeColumn('tm_workspace', 'updated_by');
  },
};
