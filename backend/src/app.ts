import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { SocketService } from './services/socketService';

// Import des routes
import authRoutes from './routes/auth';
import talentRoutes from './routes/talents';
import enterpriseRoutes from './routes/enterprises';
import missionRoutes from './routes/missions';
import formationRoutes from './routes/formations';
import academyRoutes from './routes/academy';
import matchingRoutes from './routes/matching';
import contractRoutes from './routes/contracts';
import paymentRoutes from './routes/payments';
import notificationRoutes from './routes/notifications';
// import signatureRoutes from './routes/signatures';
import adminRoutes from './routes/admin';

// Configuration des variables d'environnement
dotenv.config();

const app = express();
const PORT = process.env['PORT'] || 5050;

// Créer le serveur HTTP pour Socket.io
const server = createServer(app);

// Configuration Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TalentEx API',
      version: '1.0.0',
      description: 'API pour la plateforme TalentEx - Découverte, formation, connexion et investissement dans des talents stratégiques',
      contact: {
        name: 'TalentEx Team',
        email: 'support@talenteex.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${PORT}/api`,
        description: 'Serveur de développement',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Configuration du rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'), // 15 minutes
  max: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'), // limite par IP
  message: {
    success: false,
    error: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
  },
});

// Middleware de sécurité
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Configuration CORS
app.use(cors({
  origin: process.env['CORS_ORIGIN'] || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware de compression
app.use(compression());

// Middleware de logging
app.use(morgan('combined'));

// Rate limiting
app.use('/api/', limiter);

// Middleware pour parser le JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Documentation Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Route de santé (sans helmet ni cors)
app.get('/health', (req, res) => {
  console.log('Health check appelé');
  res.status(200).json({
    success: true,
    message: 'TalentEx API est opérationnelle',
    timestamp: new Date().toISOString(),
    environment: process.env['NODE_ENV'] || 'development',
  });
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/talents', talentRoutes);
app.use('/api/enterprises', enterpriseRoutes);
app.use('/api/missions', missionRoutes);
app.use('/api/formations', formationRoutes);
app.use('/api/academy', academyRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
// app.use('/api/signatures', signatureRoutes);
app.use('/api/admin', adminRoutes);

// Route 404 pour les endpoints non trouvés
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint non trouvé',
  });
});

// Middleware de gestion d'erreurs global
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction): void => {
  console.error('Erreur globale:', error);

  // Erreur de validation
  if (error.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: 'Erreur de validation',
      details: error.details,
    });
    return;
  }

  // Erreur JWT
  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: 'Token invalide',
    });
    return;
  }

  // Erreur JWT expiré
  if (error.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: 'Token expiré',
    });
    return;
  }

  // Erreur Prisma
  if (error.code === 'P2002') {
    res.status(409).json({
      success: false,
      error: 'Conflit de données - valeur déjà existante',
    });
    return;
  }

  // Erreur générique
  res.status(500).json({
    success: false,
    error: 'Erreur interne du serveur',
  });
  return;
});

// Initialiser Socket.io
const socketService = new SocketService(server);

// Rendre le service Socket.io disponible globalement
(global as any).socketService = socketService;

// Démarrage du serveur
server.listen(PORT, () => {
  console.log(`🚀 Serveur TalentEx démarré sur le port ${PORT}`);
  console.log(`📚 Documentation Swagger: http://localhost:${PORT}/api-docs`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 Socket.io activé pour les notifications temps réel`);
  console.log(`🌍 Environnement: ${process.env['NODE_ENV'] || 'development'}`);
});

export default app; 