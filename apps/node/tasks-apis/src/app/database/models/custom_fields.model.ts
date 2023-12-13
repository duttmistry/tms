import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { iCustomFields } from '../interface/custom_fields.interface';

export type CustomFieldsCreationAttributes = Optional<
  iCustomFields,
  'id' | 'fieldType' | 'label' | 'identifier' | 'type' | 'options' | 'is_required' | 'is_active' | 'created_by' | 'updated_by'
>;

export class CustomFieldsModel extends Model<iCustomFields, CustomFieldsCreationAttributes> implements iCustomFields {
  public fieldType:string;
  public label: string;
  public identifier: string;
  public type: string;
  public options: Array<object>;
  public is_required: boolean;
  public is_active: boolean;
  public created_by: number;
  public updated_by: number;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date;
}

export default function (sequelize: Sequelize): typeof CustomFieldsModel {
  CustomFieldsModel.init(
    {
      id: {
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      fieldType: {
        type: DataTypes.STRING(64),
      },
      label: {
        type: DataTypes.STRING(64),
      },
      identifier: {
        type: DataTypes.STRING(64),
        unique: true,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      options: {
        type: DataTypes.JSON,
      },
      is_required: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
      },
      created_by: {
        type: DataTypes.INTEGER,
        references: {
          model: {
            tableName: 'tm_users',
          },
          key: 'id',
        },
      },
      updated_by: {
        type: DataTypes.INTEGER,
        references: {
          model: {
            tableName: 'tm_users',
          },
          key: 'id',
        },
      },
    },
    {
      tableName: 'tm_custom_fields',
      sequelize,
      paranoid: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );
  return CustomFieldsModel;
}
