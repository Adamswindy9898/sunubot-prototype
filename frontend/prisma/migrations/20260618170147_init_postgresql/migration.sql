-- CreateTable
CREATE TABLE "citoyens" (
    "id" TEXT NOT NULL,
    "numero_acte" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "date_naissance" TEXT NOT NULL,
    "lieu_naissance" TEXT NOT NULL,
    "nom_pere" TEXT NOT NULL,
    "nom_mere" TEXT NOT NULL,
    "telephone" TEXT,
    "commune" TEXT NOT NULL DEFAULT 'Commune de Thiès',
    "centre_etat_civil" TEXT NOT NULL DEFAULT 'Centre d''état civil de Thiès',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "citoyens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comptes" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "dateInscription" TEXT NOT NULL,
    "numeroActe" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comptes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "compteId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demandes" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'RECU',
    "details" TEXT NOT NULL DEFAULT '{}',
    "dateCreation" TEXT NOT NULL,
    "dateMiseAJour" TEXT NOT NULL,
    "compteId" TEXT,
    "citoyenId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demandes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_records" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "telephone" TEXT,
    "data" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'actif',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_logs" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "langue" TEXT NOT NULL,
    "intent" TEXT,
    "domaine" TEXT,
    "compteId" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "statut" INTEGER NOT NULL,
    "compteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "citoyens_numero_acte_key" ON "citoyens"("numero_acte");

-- CreateIndex
CREATE UNIQUE INDEX "comptes_email_key" ON "comptes"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "demandes_reference_key" ON "demandes"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "service_records_reference_key" ON "service_records"("reference");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_compteId_fkey" FOREIGN KEY ("compteId") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demandes" ADD CONSTRAINT "demandes_compteId_fkey" FOREIGN KEY ("compteId") REFERENCES "comptes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demandes" ADD CONSTRAINT "demandes_citoyenId_fkey" FOREIGN KEY ("citoyenId") REFERENCES "citoyens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "satisfactions" (
    "id" TEXT NOT NULL,
    "nps" INTEGER NOT NULL,
    "mos" INTEGER NOT NULL,
    "commentaire" TEXT,
    "langue" TEXT NOT NULL DEFAULT 'francais',
    "service" TEXT,
    "compteId" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "satisfactions_pkey" PRIMARY KEY ("id")
);
