import { Router } from 'express'
import { dietController } from '../controllers/dietController'
import { authMiddleware } from '../middlewares/authMiddleware'
import { optionalAuthMiddleware } from '../middlewares/authMiddleware'

const router = Router()

// Rotas públicas
router.get('/foods', (req, res, next) => dietController.getAllFoods(req, res, next))
router.get('/foods/search', (req, res, next) => dietController.searchFoods(req, res, next))

// Rotas autenticadas
router.use(authMiddleware)

router.post('/plans', (req, res, next) => dietController.createDietPlan(req, res, next))
router.get('/plans', (req, res, next) => dietController.getUserDietPlans(req, res, next))
router.get('/plans/:planId', (req, res, next) => dietController.getDietPlan(req, res, next))
router.put('/plans/:planId', (req, res, next) => dietController.updateDietPlan(req, res, next))
router.delete('/plans/:planId', (req, res, next) => dietController.deleteDietPlan(req, res, next))

// Refeições
router.post('/plans/:planId/meals', (req, res, next) => dietController.addMeal(req, res, next))
router.delete('/meals/:mealId', (req, res, next) => dietController.removeMeal(req, res, next))

// Alimentos em refeições
router.post('/meals/:mealId/foods', (req, res, next) =>
  dietController.addFoodToMeal(req, res, next)
)
router.delete('/meal-foods/:mealFoodId', (req, res, next) =>
  dietController.removeFoodFromMeal(req, res, next)
)

// Progresso
router.post('/progress', (req, res, next) => dietController.addProgress(req, res, next))
router.get('/progress', (req, res, next) => dietController.getUserProgress(req, res, next))

// Geração de plano via IA
router.post('/generate-ai', (req, res, next) => dietController.generateDietAI(req, res, next))
router.post('/plans/ai', (req, res, next) => dietController.saveGeneratedDietAI(req, res, next))

export default router
