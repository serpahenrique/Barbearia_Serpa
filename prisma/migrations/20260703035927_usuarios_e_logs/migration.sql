-- CreateTable
CREATE TABLE `usuarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(60) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `senha` VARCHAR(255) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'INATIVO',
    `codigoAtivacao` VARCHAR(100) NULL,
    `codigoRecuperacaoSenha` VARCHAR(10) NULL,
    `validadeCodigoRecuperacaoSenha` DATETIME(3) NULL,
    `tentativasLoginInvalidas` INTEGER NOT NULL DEFAULT 0,
    `usuarioBloqueado` BOOLEAN NOT NULL DEFAULT false,
    `ultimoLogin` DATETIME(3) NULL,
    `barbeiroId` INTEGER NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `usuarios_email_key`(`email`),
    UNIQUE INDEX `usuarios_barbeiroId_key`(`barbeiroId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuarioId` INTEGER NULL,
    `acao` VARCHAR(100) NOT NULL,
    `descricao` VARCHAR(255) NULL,
    `enderecoIp` VARCHAR(45) NULL,
    `dataHora` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `usuarios` ADD CONSTRAINT `usuarios_barbeiroId_fkey` FOREIGN KEY (`barbeiroId`) REFERENCES `barbeiros`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `logs` ADD CONSTRAINT `logs_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
