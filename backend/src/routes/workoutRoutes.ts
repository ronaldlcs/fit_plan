import { Router } from 'express'
import { workoutController } from '../controllers/workoutController'
import { authMiddleware } from '../middlewares/authMiddleware'

const router = Router()

// Rotas públicas
router.get('/exercises', (req, res, next) =>
  workoutController.getAllExercises(req, res, next)
)
router.get('/exercises/filter', (req, res, next) =>
  workoutController.filterExercises(req, res, next)
)

// Rotas autenticadas
router.use(authMiddleware)

router.post('/plans', (req, res, next) =>
  workoutController.createWorkoutPlan(req, res, next)
)
router.get('/plans', (req, res, next) =>
  workoutController.getUserWorkoutPlans(req, res, next)
)

// Geração de plano a partir de template + plano ativo
// (definidos antes de '/plans/:planId' para não colidir com a rota dinâmica)
router.post('/plans/generate', (req, res, next) =>
  workoutController.generatePlan(req, res, next)
)
router.get('/plans/active', (req, res, next) =>
  workoutController.getActivePlan(req, res, next)
)
router.post('/plans/:planId/activate', (req, res, next) =>
  workoutController.setActivePlan(req, res, next)
)

router.get('/plans/:planId', (req, res, next) =>
  workoutController.getWorkoutPlan(req, res, next)
)
router.put('/plans/:planId', (req, res, next) =>
  workoutController.updateWorkoutPlan(req, res, next)
)
router.delete('/plans/:planId', (req, res, next) =>
  workoutController.deleteWorkoutPlan(req, res, next)
)

// Sessões
router.post('/plans/:planId/sessions', (req, res, next) =>
  workoutController.addSession(req, res, next)
)
router.delete('/sessions/:sessionId', (req, res, next) =>
  workoutController.removeSession(req, res, next)
)
router.post('/sessions/:sessionId/complete', (req, res, next) =>
  workoutController.completeSession(req, res, next)
)

// Exercícios em sessões
router.post('/sessions/:sessionId/exercises', (req, res, next) =>
  workoutController.addExerciseToSession(req, res, next)
)
router.delete('/session-exercises/:sessionExerciseId', (req, res, next) =>
  workoutController.removeExerciseFromSession(req, res, next)
)

// Treinos realizados
router.post('/workout-logs', (req, res, next) =>
  workoutController.registerWorkout(req, res, next)
)
router.get('/workout-logs', (req, res, next) =>
  workoutController.getUserWorkouts(req, res, next)
)

export default router
