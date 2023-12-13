'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('tm_tasks', 'task_unique_key', {
      type: Sequelize.STRING(64),
      allowNull: true
    });
    await queryInterface.addColumn('tm_tasks', 'task_key_prefix', {
      type: Sequelize.STRING(64),
      allowNull: true
    });
    await queryInterface.changeColumn('tm_tasks','task_key',{
      type: Sequelize.STRING(128),
      allowNull:true
    })
    await queryInterface.sequelize.query(`
    CREATE TRIGGER enforce_unique_task_key
    BEFORE INSERT ON tm_tasks FOR EACH ROW BEGIN
    DECLARE last_task_number INT;
    SELECT MAX(CAST(task_unique_key AS UNSIGNED)) INTO last_task_number
    FROM tm_tasks
    WHERE task_key_prefix = NEW.task_key_prefix;
    
    IF last_task_number IS NULL THEN
        SET NEW.task_unique_key = 1,NEW.task_key = CONCAT(NEW.task_key_prefix,'-',NEW.task_unique_key);
    ELSE
        SET NEW.task_unique_key = last_task_number + 1,NEW.task_key = CONCAT(NEW.task_key_prefix,'-',NEW.task_unique_key);
        WHILE EXISTS (
            SELECT 1
            FROM tm_tasks
            WHERE task_key_prefix = NEW.task_key_prefix
            AND task_unique_key = NEW.task_unique_key
        ) DO
            SET NEW.task_unique_key = NEW.task_unique_key + 1,NEW.task_key = CONCAT(NEW.task_key_prefix,'-',NEW.task_unique_key); -- Increment the task_unique_key until it becomes unique
        END WHILE;
    END IF;
END
  `);
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
