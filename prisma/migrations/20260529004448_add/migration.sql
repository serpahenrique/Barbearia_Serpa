-- CreateTable
CREATE TABLE `barbeiros` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(40) NOT NULL,
    `obs` VARCHAR(100) NULL,
    `saldo` DECIMAL(9, 2) NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clientes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(40) NOT NULL,
    `email` VARCHAR(60) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `servicos_produtos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(60) NOT NULL,
    `quant` SMALLINT NOT NULL,
    `preco` DECIMAL(9, 2) NOT NULL,
    `categoria` ENUM('Servico', 'Produto') NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vendas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clienteId` INTEGER NOT NULL,
    `servicoId` INTEGER NOT NULL,
    `barbeiroId` INTEGER NOT NULL,
    `fPagamento` ENUM('PIX', 'Dinheiro', 'Cartao') NOT NULL,
    `quant` INTEGER NOT NULL DEFAULT 1,
    `preco` DECIMAL(9, 2) NOT NULL,
    `data` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `vendas` ADD CONSTRAINT `vendas_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendas` ADD CONSTRAINT `vendas_servicoId_fkey` FOREIGN KEY (`servicoId`) REFERENCES `servicos_produtos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendas` ADD CONSTRAINT `vendas_barbeiroId_fkey` FOREIGN KEY (`barbeiroId`) REFERENCES `barbeiros`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
