'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tm_users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      first_name: {
        type: Sequelize.STRING(64),
      },
      last_name: {
        type: Sequelize.STRING(64),
      },
      emails: {
        type: Sequelize.JSON,
      },
      contact_number: {
        type: Sequelize.STRING(64),
      },
      dob: {
        type: Sequelize.DATE,
      },
      designation: {
        type: Sequelize.STRING(64),
      },
      team_lead: {
        type: Sequelize.STRING(64),
      },
      project_manager: {
        type: Sequelize.STRING(64),
      },
      production_date: {
        type: Sequelize.DATE,
      },
      departments: {
        type: Sequelize.JSON,
      },
      technologies: {
        type: Sequelize.JSON,
      },
      employee_image: {
        type: Sequelize.TEXT,
      },
      status: {
        type: Sequelize.STRING(16),
      },
      is_active: {
        type: Sequelize.BOOLEAN,
      },
      present_address: {
        type: Sequelize.JSON,
      },
      education: {
        type: Sequelize.JSON,
      },
      certificates: {
        type: Sequelize.JSON,
      },
      gender: {
        type: Sequelize.STRING(4),
      },
      marital_status: {
        type: Sequelize.STRING(16),
      },
      blood_group: {
        type: Sequelize.STRING(4),
      },
      employee_id: {
        type: Sequelize.STRING(64),
      },
      skype: {
        type: Sequelize.STRING(256),
      },
      linkedin: {
        type: Sequelize.STRING(256),
      },
      password: {
        type: Sequelize.STRING(256),
      },
      role: {
        type: Sequelize.STRING(16),
      },
      skill_description: {
        type: Sequelize.STRING(256),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
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
    await queryInterface.dropTable('tm_users');
  },
};
