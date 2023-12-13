import _DB from '../../../database/models';
import { Op, WhereOptions, Sequelize } from 'sequelize';
import { iTag } from '../../../database/interface/tag.interface';
import { Query } from '@tms-workspace/apis-core';

const tag = _DB.Tag;
const project_tag = _DB.ProjectTags;

class TagService {

  public _count = async (query) => {
    return new Promise((resolve) => {
      const data = tag.count({
        where:query,
      });
      resolve(data);
    });
  };

  public _getTagsWithPage = async (query: WhereOptions = {}, p = 0, l = 0, sortBy = 'id', orderBy = 'asc') => {
    const { offset, limit, order } = Query.getQuery({
      page: p,
      limit: l,
      sortBy,
      orderBy,
    });
    return new Promise((resolve) => {
      const data = tag.findAll({
        where:query,
        attributes: {
          include: ['id', 'title'],
        },
        limit: limit > 0 ? limit : null,
        offset: offset > 0 ? offset : null,
        order,
      });
      resolve(data);
    });
  };

  public _getTags = async (query) => {
    return new Promise((resolve) => {
      const data = tag.findAll({
        where:query,
        attributes: {
          include: ['id', 'title'],
        },
      });
      resolve(data);
    });
  };

  public _getTag = async (query: WhereOptions) => {
    return new Promise((resolve) => {
      const data = tag.findOne({
        attributes: {
          include: ['id', 'title'],
        },
        where: query,
      });
      resolve(data);
    });
  };

  public _createTag = async (tagData: iTag) => {
    return new Promise((resolve) => {
      const data = tag.create(tagData);
      resolve(data);
    });
  };
  
  public _findOrCreateTag = async (tagData: iTag) => {
    return new Promise((resolve) => {
      const data: Promise<{ tag_id: number }> = tag
        .findOrCreate({
          where: { title: tagData.title },
        })
        .then((res) => {
          return JSON.parse(JSON.stringify(res[0]));
        });

      resolve(data);
    });
  };

  public _updateTag = async (Tag: iTag, id: number) => {
    return new Promise((resolve) => {
      const data = tag.update(Tag, {
        where: {
          id,
        },
      });

      resolve(data);
    });
  };

  public _deleteTag = async (id: number) => {
    return new Promise((resolve) => {
      const data = tag.destroy({
        where: {
          id,
        },
      });

      resolve(data);
    });
  };

  public _getLinkedTags = async (id: number) => {
    return new Promise<{ tag_id: number; project_id: number }[]>((resolve) => {
      const data = project_tag.findAll({
        where: {
          tag_id: id,
        },
      });

      resolve(data);
    });
  };
}
export default TagService;
