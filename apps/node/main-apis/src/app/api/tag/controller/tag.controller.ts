import { APIResponseFormat, Pagination } from '@tms-workspace/apis-core';
import { NextFunction, Request, Response } from 'express';
import TagService from '../services/tag.service';
import ProjectService from '../../project/services/project.service';
import { Op, Sequelize } from 'sequelize';

class TagController {
  public tagService = new TagService();
  public projectService = new ProjectService();

  public getTags = async (req: Request, res: Response, next: NextFunction) => {
    const search=req.query.search||'';
    try {
      const data = await this.tagService._getTags({title:{ [Op.like]: `%${search}%` }});
      return res.status(200).json(APIResponseFormat._ResDataFound(data));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };
  public getTagByID = async (req: Request, res: Response, next: NextFunction) => {
    const tagId = Number(req.headers.id);
      if (!tagId) return res.status(409).json(APIResponseFormat._ResMissingRequiredField('Tag Id'));
    try {
      const data = await this.tagService._getTags({id:tagId});
      return res.status(200).json(APIResponseFormat._ResDataFound(data));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };
  

  public getTagsWithPagiate = async (req: Request, res: Response, next: NextFunction) => {
    const { page, limit, sortBy, orderBy, search } = req.query;
    try {
      let where = {};
      if (search) {
        where = {title:{ [Op.like]: `%${search}%` }}
      }
      const count : any = await this.tagService._count(where);
      if (count < 1) {
        return res.status(200).json(APIResponseFormat._ResDataFound([]));
      }
      const data = await this.tagService._getTagsWithPage(where,Number(page), Number(limit), sortBy as string, orderBy as string);
      const { pageNumber, totalPages } = Pagination.pagination(page as string, limit as string, count as number);

      return res.status(200).json(APIResponseFormat._ResDataFoundWithPagination(data, totalPages, limit as string, count as number, pageNumber));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  public addTags = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tags = req.body.tags;
      const availableTags = [];
      const newTags = [];

      if (!tags) return res.status(409).json(APIResponseFormat._ResMissingRequiredField('Tags'));
      
      for (const tag of tags) {
        const checkTag = await this.tagService._getTag(tag);
        if (checkTag) {
          availableTags.push(checkTag);
        } else {
          newTags.push(tag);
        }
      }


      // create new tags
      const data = await Promise.all(
        newTags.map((tag) => {
          return this.tagService._createTag(tag);
        })
      );

      if (!data) return res.status(500).json(APIResponseFormat._ResDataCreated('Tag'));
      
      if(data.length>0){
        return res.status(200).json(APIResponseFormat._ResDataCreated('Tag', data));
      }else {
        return res.status(200).json(APIResponseFormat._ResAlreadyExistTags('Tag', availableTags));
      }

    } catch (error) {

      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  public updateTag = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tagId = Number(req.headers.id);
      const { title } = req.body;

      if (!tagId) return res.status(409).json(APIResponseFormat._ResMissingRequiredField('Tag Id'));

      if (!title && title != '') return res.status(409).json(APIResponseFormat._ResMissingRequiredField('Tag Title'));

      const checkTag = await this.tagService._getTag({ id: tagId });

      if (!checkTag) {
        return res.status(409).json(APIResponseFormat._ResDataNotFound('Tag'));
      }

      const validationByTitle = await this.tagService._getTag({
        title,
        id: {
          [Op.ne]: tagId,
        },
      });

      if (validationByTitle) {
        return res.status(409).json(APIResponseFormat._ResDataExists('Tag', 'Title'));
      }

      const data = await this.tagService._updateTag({ title }, tagId);

      if (!data) return res.status(500).json(APIResponseFormat._ResDataNotCreated('Tag'));

      return res.status(201).json(APIResponseFormat._ResDataUpdated('Tag'));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  public deleteTag = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tagId = Number(req.headers.id);

      const checkDeletedTag = await this.tagService._getTag({ id: tagId });

      if (!checkDeletedTag) return res.status(409).json(APIResponseFormat._ResDataNotFound({}));

      const data = await this.tagService._deleteTag(tagId);

      if (!data) return res.status(500).json(APIResponseFormat._ResDataNotDeleted('Tag'));

      const checkUsedTag = await this.tagService._getLinkedTags(tagId);

      if (checkUsedTag.length > 0) {
        const deleteLinkedTagFromProject = await this.projectService._deleteProjectTags({ tag_id: tagId });
        if (!deleteLinkedTagFromProject) return res.status(500).json(APIResponseFormat._ResDataNotDeleted('Tag'));
      }

      return res.status(200).json(APIResponseFormat._ResDataDeleted('Tag'));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };
}

export default TagController;
