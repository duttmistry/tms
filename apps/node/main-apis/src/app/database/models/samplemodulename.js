'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class sampleModuleName extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  sampleModuleName.init({
    title: DataTypes.STRING,
    from_date: DataTypes.DATE,
    to_date: DataTypes.DATE,
    month: DataTypes.STRING,
    year: DataTypes.INTEGER,
    deleted_at: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'sampleModuleName',
    underscored: true,
  });
  return sampleModuleName;
};