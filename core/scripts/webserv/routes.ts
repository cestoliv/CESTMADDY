import { Router } from 'express'

import { staticFront, staticContent, static404, redirExtIndexes, intercept } from './controllers'

const router = Router()

router.use("/front", staticFront)
router.use(redirExtIndexes)
router.use(intercept)
router.use(staticContent)
router.use(static404)

export default router
