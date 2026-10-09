import Elysia from "elysia"
import { adminRouter } from "./adminRouter"
import { categoryRouter } from "./categoryRouter"
import { commentRouter } from "./commentRouter"
import { postRouter } from "./postRouter"
import { userRouter } from "./userRouter"

export const router = new Elysia({ prefix: '/api' })
    .use(userRouter)
    .use(postRouter)
    .use(commentRouter)
    .use(categoryRouter)
    .use(adminRouter)
