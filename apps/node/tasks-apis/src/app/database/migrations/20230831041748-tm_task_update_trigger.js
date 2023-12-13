'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create the "update_task_key" trigger for UPDATE
    await queryInterface.sequelize.query(`
      CREATE TRIGGER update_task_key
      BEFORE UPDATE ON tm_tasks
      FOR EACH ROW
      BEGIN
        DECLARE last_task_number_update INT;
        IF OLD.project_id <> NEW.project_id THEN
          SELECT COALESCE(MAX(CAST(task_unique_key AS UNSIGNED)), 0) INTO last_task_number_update
          FROM tm_tasks
          WHERE task_key_prefix = NEW.task_key_prefix;
          
          SET NEW.task_unique_key = last_task_number_update + 1;
          SET NEW.task_key = CONCAT(NEW.task_key_prefix,'-',NEW.task_unique_key);
          
          WHILE EXISTS (
            SELECT 1
            FROM tm_tasks
            WHERE task_key_prefix = NEW.task_key_prefix
            AND task_unique_key = NEW.task_unique_key
          ) DO
            SET NEW.task_unique_key = NEW.task_unique_key + 1;
            SET NEW.task_key = CONCAT(NEW.task_key_prefix,'-',NEW.task_unique_key);
          END WHILE;
        END IF;
      END;
    `);
  },

  async down(queryInterface, Sequelize) {
    // Drop the triggers and function here if necessary
  },
};
