import { Routes } from "@tms-workspace/apis-core";
import { auth } from "@tms-workspace/auth/user-authentication";
import { Router } from "express";
import CustomFieldsController from "./controller/custom_fields.controller";

class CustomFieldsRoute implements Routes {
  public router = Router();
  public controller = new CustomFieldsController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`/custom/fields`, auth.default, this.controller.getCustomFields);
    this.router.post(`/custom/fields`, auth.default, this.controller.createCustomFields);
    this.router.put(`/custom/fields`, auth.default, this.controller.updateCustomFields);
  }
}

export default CustomFieldsRoute;