
export interface LiveDataItem {
    Oficina: string;
    Servicio: string;
    Hora_Minuto: string;
    Segundos_Espera: number;
    Segundos_Servicio: number;
    Atendidos: number;
    Abandonos: number;
    Total_Turnos: number;
    Espera_Etiqueta: string;
    Servicio_Etiqueta: string;
    Espera_Warning_Segs: number;
    Espera_Critical_Segs: number;
    Servicio_Warning_Segs: number;
    Servicio_Critical_Segs: number;
}
