'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Execute raw SQL query to set the global value
    await queryInterface.sequelize.query('SET GLOBAL group_concat_max_len = 1000000;');
  },

  down: async (queryInterface, Sequelize) => {
    // Revert the change if necessary
    await queryInterface.sequelize.query('SET GLOBAL group_concat_max_len = <original_value>;');
  }
};