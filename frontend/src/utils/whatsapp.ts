export const WhatsAppTemplates = {
    driverAvailable: (plate: string, location: string) =>
        `Caminhão do seu frete de hoje *${plate}* já está disponível para carregamento na *${location}*.\n\nEm breve, sua carga estará a caminho! 🦅`,

    arrivedDelivery: (driverName: string) =>
        `Nosso motorista *${driverName}* chegou ao local de descarregamento.\n\nEm breve, a entrega será concluída. 🤩🦅`,

    finished: (driverName: string) =>
        `Caminhão com motorista *${driverName}* encerrou o descarregamento. Frete finalizado com sucesso em breve você irá receber a documentação.\n\nAgradecemos a parceria na contratação dos nossos serviços. Estamos à disposição!`,

    pickupConfirmation: (plate: string, location: string) =>
        `Bom dia!\n\nVeículo placa *${plate}* já se encontra no local de coleta em *${location}*.\nIniciando carregamento.\n\nQualquer dúvida estou à disposição.`,

    deliveryConfirmation: (driverName: string) =>
        `Entrega realizada pelo motorista *${driverName}*!\n\nObrigado pela preferência. A documentação será enviada em breve.`,

    driverData: (driverName: string, cpf: string, antt: string, plate: string, location: string) =>
        `🔔 *Mensagem Automática*\n\nA Eagles Transportes vem, por meio desta, informar os dados do motorista responsável pelo carregamento:\n\n🚚 *Motorista:* ${driverName}\n📑 *CPF:* ${cpf}\n🛣️ *ANTT:* ${antt || '—'}\n🚘 *Placa do veículo:* ${plate}\n\nEm caso de dúvidas, permanecemos à disposição para esclarecimentos.\n\nAtenciosamente,\n*Eagles Transportes*`
};

export const openWhatsApp = (phone: string, message: string) => {
    // Clear phone number (remove non-digits)
    const cleanPhone = phone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/55${cleanPhone}?text=${encodedMessage}`;
    window.open(url, '_blank');
};
