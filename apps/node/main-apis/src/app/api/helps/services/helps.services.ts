import { error } from 'console';
import { iHelps } from '../../../database/interface/helps.interface';
import _DB from '../../../database/models';
import { query } from 'express';
import { WhereOptions } from 'sequelize';

const helps = _DB.Helps;

class HelpService {
  // GET SINGLE Site Setting
  public _getSingleData = async (where: WhereOptions) => {
    return new Promise<iHelps>((resolve, reject) => {
      const data = helps
        .findAll({
          where,
        })
        .then((res) => JSON.parse(JSON.stringify(res)));
      resolve(data);
    });
  };

  public _checkCategoryExistORNot = async (cateogry : string) => {
    return new Promise<boolean>((resolve, reject) => {
      const data = helps
        .findAll({
          where: {
            category: cateogry,
          },
        })
        .then((res) => JSON.parse(JSON.stringify(res)));
      resolve(data);
    });
  }

  // post 
  // public _createData = async (help) => {
  //   try{
  //     const data = await helps.create(help);
  //     return data;
  //   }
  //   catch(error){
  //     console.log(error);
  //     throw error;
  //   }
  // }

}

export default HelpService;
