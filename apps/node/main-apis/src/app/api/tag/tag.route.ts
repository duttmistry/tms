import { Router } from 'express';
import { Routes } from '@tms-workspace/apis-core';
import { auth } from '@tms-workspace/auth/user-authentication';
import Tag from './controller/tag.controller';

class TagRoute implements Routes {
  public router = Router();
  public controller = new Tag();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`/tags`, auth.default, this.controller.getTags);
    this.router.get(`/tag`, auth.default, this.controller.getTagByID);
    this.router.get(`/tags/list`, auth.default, this.controller.getTagsWithPagiate);
    this.router.post(`/tags`, auth.default, this.controller.addTags);
    this.router.put(`/tag`, auth.default, this.controller.updateTag);
    this.router.delete(`/tag`, auth.default, this.controller.deleteTag);
  }
}

export default TagRoute;
