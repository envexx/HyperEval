import { Router, type IRouter } from "express";
import healthRouter from "./health";
import hypercertsRouter from "./hypercerts";
import evaluationRouter from "./evaluation";
import extractionRouter from "./extraction";
import agentRouter from "./agent";

const router: IRouter = Router();

router.use(healthRouter);
router.use(hypercertsRouter);
router.use(evaluationRouter);
router.use(extractionRouter);
router.use(agentRouter);

export default router;
