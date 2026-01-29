
export class DataNormalizer {
    static parseExcelDate(val) {
        if (!val) return val;
        // Check if it's an Excel serial number (approx range for recent years: 40000 - 50000)
        if (typeof val === 'number' && val > 40000 && val < 55000) {
            const date = new Date(Math.round((val - 25569) * 86400 * 1000));
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        }
        return val;
    }

    static normalize(rawData) {
        if (!rawData || rawData.length === 0) return [];

        const headers = rawData[0]; // Assuming first row is header for now, merger loop handles empty rows
        if (!headers) return [];

        const mapping = this.detectColumns(headers);

        return rawData.map(row => { // Process all rows, headers are keys
            // Core Grid KPIs
            const kpis = {
                gestH: this.parseNumber(row[mapping.gestH]),
                cerrH: this.parseNumber(row[mapping.cerrH]),

                // Percentages
                ncoBO: this.normalizePercent(row[mapping.ncoBO]),
                ncoCall: this.normalizePercent(row[mapping.ncoCall]),
                adherence: this.normalizePercent(row[mapping.adherence]),
                tipif: this.normalizePercent(row[mapping.tipif]),
                transfer: this.normalizePercent(row[mapping.transfer]),

                aht: this.parseNumber(row[mapping.aht]),
                nps: this.parseNumber(row[mapping.nps]),
                ncp: this.parseNumber(row[mapping.ncp]),

                calls: this.parseNumber(row[mapping.calls]),
                gestTotal: this.parseNumber(row[mapping.gestTotal]),
                cerrTotal: this.parseNumber(row[mapping.cerrTotal])
            };

            const agentName = row[mapping.name] || row[mapping.agent] || 'Desconocido';

            // Try to find a valid ID
            const id = row[mapping.id] || row[mapping.idBoost] || row[mapping.idEmpl];

            // Skip rows with no valid Name AND no valid ID (likely empty)
            if (agentName === 'Desconocido' && !id) return null;

            const admin = {
                // Identity
                dni: row[mapping.dni],
                email: row[mapping.email],
                tlf: row[mapping.tlf],
                login: row[mapping.login],
                extension: row[mapping.extension],

                // Work Info
                service: row[mapping.service],
                category: row[mapping.category],
                category: row[mapping.category],
                segment: (() => {
                    // 1. Try explicit column
                    let val = this.parseSegment(row[mapping.segment]);
                    if (val) return val;

                    // 2. Try Heuristic Scan (Content-Based)
                    // If explicit column failed, look for "ESTANDAR" or "JURIDICO" in other potential columns
                    if (mapping.segmentCandidates) {
                        for (const key of mapping.segmentCandidates) {
                            const candidateVal = row[key];
                            if (!candidateVal) continue;
                            const parsed = this.parseSegment(candidateVal);
                            if (parsed) return parsed;
                        }
                    }

                    return null; // Return null so DataMerger allows other sheets (BBDD) to fill this gap
                })(),
                language: row[mapping.language],
                antiguedad: this.parseExcelDate(row[mapping.antiguedad]),
                tm: row[mapping.tmAdmin],
                schedule: row[mapping.schedule],
                emea: row[mapping.emea],
                ilt: row[mapping.ilt],

                // Systems
                userRed: row[mapping.userRed],
                userSitel: row[mapping.userSitel],
                userSyr: row[mapping.userSyr],

                // Dynamic Salesforce Selection: Find first candidate that is a valid string ID
                salesforce: (() => {
                    if (mapping.salesforceCandidates) {
                        for (const key of mapping.salesforceCandidates) {
                            const val = row[key];
                            const str = String(val).trim();

                            // Heuristic to detect valid ID vs Score/Name:
                            // 1. Must be > 2 chars
                            // 2. Must NOT be the Agent Name (approx match)
                            // 3. Must NOT contain spaces (Users are usually single words/codes, Names have spaces)
                            // 4. Must NOT look like a small number or float (Score/Level/Percent)
                            const asNum = parseFloat(str);
                            const isSmallNumber = !isNaN(asNum) && (asNum < 10000 || str.includes('.'));

                            if (val && str.length > 2 && !str.includes(' ') && str !== agentName && !isSmallNumber) {
                                return val;
                            }
                        }
                    }
                    return undefined;
                })(),

                amadeus: row[mapping.amadeus],
                resiber: row[mapping.resiber],
                callcenter: row[mapping.callcenter],
                desktop: row[mapping.desktop],

                // Skills / Attributes - Date Parsing Applied to ALL potentially date attributes
                asignacion: this.parseExcelDate(row[mapping.asignacion]),
                boEquipaje: this.parseExcelDate(row[mapping.boEquipaje]),
                boPasaje: this.parseExcelDate(row[mapping.boPasaje]),
                vip: this.parseExcelDate(row[mapping.vip]),
                redes: this.parseExcelDate(row[mapping.redes]),
                rpm: this.parseExcelDate(row[mapping.rpm]),
                infinita: this.parseExcelDate(row[mapping.infinita]),
                owAjb: this.parseExcelDate(row[mapping.owAjb]),
                atencionPersonal: this.parseExcelDate(row[mapping.atencionPersonal]),
                pmr: this.parseExcelDate(row[mapping.pmr]),
                tasasChile: this.parseExcelDate(row[mapping.tasasChile]),
                futurosVuelos: this.parseExcelDate(row[mapping.futurosVuelos]),
                yq: this.parseExcelDate(row[mapping.yq]),
                reembolsosParcial: this.parseExcelDate(row[mapping.reembolsosParcial]),
                reembolsoTotal: this.parseExcelDate(row[mapping.reembolsoTotal]),
                bonos: this.parseExcelDate(row[mapping.bonos]),
                incidenciaPagos: this.parseExcelDate(row[mapping.incidenciaPagos]),
                servGastronomicos: this.parseExcelDate(row[mapping.servGastronomicos]),
                gerencia: this.parseExcelDate(row[mapping.gerencia]),
                sysInformes: this.parseExcelDate(row[mapping.sysInformes]),
                anac: this.parseExcelDate(row[mapping.anac]),
                ebonos: this.parseExcelDate(row[mapping.ebonos]),
                macros: this.parseExcelDate(row[mapping.macros]),
                busqueda: this.parseExcelDate(row[mapping.busqueda]),
                livechat: this.parseExcelDate(row[mapping.livechat]),
                incivia: this.parseExcelDate(row[mapping.incivia]),
                instrucciones: this.parseExcelDate(row[mapping.instrucciones]),
                trainEstandar: this.parseExcelDate(row[mapping.trainEstandar]),
                abogados: this.parseExcelDate(row[mapping.abogados]),
                demandas: this.parseExcelDate(row[mapping.demandas]),
                aesa: this.parseExcelDate(row[mapping.aesa]),
                omics: this.parseExcelDate(row[mapping.omics]),
                pagosEsp: this.parseExcelDate(row[mapping.pagosEsp]),
                asignacionIdioma: this.parseExcelDate(row[mapping.asignacionIdioma]),
                tramitacionIdioma: this.parseExcelDate(row[mapping.tramitacionIdioma]),
                sudamericaAsign: this.parseExcelDate(row[mapping.sudamericaAsign]),
                sudamericaTram: this.parseExcelDate(row[mapping.sudamericaTram]),
                reembolsosJuridico: this.parseExcelDate(row[mapping.reembolsosJuridico]),
                aviacionCivil: this.parseExcelDate(row[mapping.aviacionCivil]),
                adr: this.parseExcelDate(row[mapping.adr]),
                normativaDot: this.parseExcelDate(row[mapping.normativaDot]),
                trainJuridico: this.parseExcelDate(row[mapping.trainJuridico]),
                tec: this.parseExcelDate(row[mapping.tec]),
                contar: row[mapping.contar],
                peticion: row[mapping.peticion],
                vb: row[mapping.vb],
                dailyControl: mapping.dailyControl.reduce((acc, key) => {
                    acc[key] = row[key];
                    return acc;
                }, {})
            };

            return {
                _raw: row,
                agent: agentName,
                id: id,
                supervisor: row[mapping.supervisor] || 'Sin Asignar',
                kpis: kpis,
                metrics: kpis,
                admin: admin // New Field: Now contains all expanded properties
            };
        }).filter(r => r !== null);
    }

    static detectColumns(row) {
        const keys = row ? Object.keys(row) : [];

        const find = (arr, excludes = []) => {
            return keys.find(k => {
                const lower = k.toLowerCase().trim();
                const matches = arr.some(pattern => lower.includes(pattern.toLowerCase()));
                const excluded = excludes.some(ex => lower.includes(ex.toLowerCase()));
                return matches && !excluded;
            });
        };

        // Exact match helper for short codes like "ID", "VIP"
        const findExact = (arr) => {
            return keys.find(k => arr.some(pattern => k.trim().toLowerCase() === pattern.toLowerCase()));
        };

        const nameCol = keys.find(k => {
            const lower = k.toLowerCase();
            if (lower.includes('usuario') || lower.includes('user')) return false;
            return (lower.includes('nombre') || lower.includes('name') || lower.includes('agente'))
                && !lower.includes('id') && !lower.includes('cod');
        });

        const detection = {
            name: nameCol,
            id: find(['id boost', 'id_boost', 'id_empl', 'ficha', 'id empleado', 'login']), // Removed generic 'id' to avoid false positives with other IDs
            idBoost: find(['id boost', 'id_boost']),
            idEmpl: find(['id empleado', 'id_empl', 'id_empleado']),
            agent: find(['agente', 'nombre', 'name', 'nombres y apellidos'], ['usuario', 'user']),
            supervisor: find(['supervisor', 'team', 'tm', 'gestor', 'equipo', 'responsable']),
        };

        const dateCols = keys.filter(k => /^\d{8}$/.test(k.trim()));

        return {
            name: nameCol,
            dailyControl: dateCols, // Store detected date columns
            ...detection,

            // Admin Data - Identity
            dni: find(['dni', 'documento', 'nif']),
            email: find(['email', 'correo']),
            tlf: find(['tlf', 'telefono', 'movil']),
            login: findExact(['login']),
            extension: find(['extension', 'ext']),


            // Content-Based Candidates (if header fails)
            // Exclude columns that are likely Training, Comments, or Dates to avoid false positives
            segmentCandidates: keys.filter(k => {
                const lower = k.toLowerCase();
                // Explicitly include likely fallback columns (Column J is often 9 or 10 depending on indexing)
                if (k.includes('__EMPTY')) return true;

                if (dateCols.includes(k)) return false;
                if (lower.includes('train') || lower.includes('formacion') || lower.includes('curso')) return false;
                if (lower.includes('obs') || lower.includes('comentario') || lower.includes('nota')) return false;
                if (lower.includes('fecha') || lower.includes('date')) return false;
                return !nameCol || k !== nameCol;
            }),

            // Admin Data - Work Info
            service: find(['servicio', 'campaña']),
            // Exclude % and scores from category to avoid "0.99"
            category: find(['categoria', 'puesto'], ['%', 'score', 'puntuacion', 'objetivo', 'target', 'cumplimiento', 'nota']),
            segment: find(['segmento', 'skill', 'perfil', 'tipo']), // Expanded keywords
            language: find(['idioma', 'language']),
            antiguedad: find(['antiguedad', 'antigüedad', 'fecha alta']),
            tmAdmin: find(['tm', 'team manager', 'responsable', 'gestor']),
            schedule: find(['horario', 'turno']),
            emea: find(['emea']),
            ilt: find(['ilt/mat/exc', 'ilt', 'baja']),

            // Admin Data - Systems
            userRed: find(['usuario red', 'user red', 'u_red']),
            userSitel: find(['user sitel', 'usuario sitel']),
            userSyr: find(['user syr', 'usuario syr', 'login syr', 'user_syr']),

            // Capture ALL likely Salesforce columns to filter by value in normalize
            salesforceCandidates: keys.filter(k => {
                const lower = k.toLowerCase();
                return (lower.includes('salesforce') || lower.includes('sf')) &&
                    !lower.includes('nivel') && !lower.includes('level') && !lower.includes('score');
            }),

            amadeus: find(['amadeus']),
            resiber: find(['resiber']),
            callcenter: find(['callcenter']),
            desktop: find(['desktop']),

            // Skills / Queues / Boolean Attributes
            asignacion: find(['asignacion', 'asignación']),
            boEquipaje: find(['bo equipaje']),
            boPasaje: find(['bo pasaje']),
            vip: findExact(['vip']),
            redes: find(['redes/prensa', 'redes', 'prensa']),
            rpm: findExact(['rpm']),
            infinita: find(['infinita']),
            owAjb: find(['ow/ajb', 'ow', 'ajb']),
            atencionPersonal: find(['atencion personal', 'atención personal']),
            pmr: find(['pmr', 'lesionados']),
            tasasChile: find(['tasas chile']),
            futurosVuelos: find(['futuros vuelos']),
            yq: findExact(['yq']),
            reembolsosParcial: find(['reembolsos parcial']),
            reembolsoTotal: find(['reembolso total']),
            bonos: findExact(['bonos']),
            incidenciaPagos: find(['incidencia de pagos']),
            servGastronomicos: find(['serv gastronomicos']),
            gerencia: find(['gerencia']),
            sysInformes: find(['sys informes']),
            anac: find(['anac']),
            ebonos: find(['ebonos']),
            macros: find(['macros']),
            busqueda: find(['equipo de busqueda']),
            livechat: find(['livechat']),
            incivia: find(['incivia']),
            instrucciones: find(['instrucciones']),
            trainEstandar: find(['train estandar']),
            abogados: find(['abogados']),
            demandas: find(['demandas']),
            aesa: findExact(['aesa']),
            omics: findExact(['omics']),
            pagosEsp: find(['pagos españa']),
            asignacionIdioma: find(['asignacion idioma']),
            tramitacionIdioma: find(['tramitacion idioma']),
            sudamericaAsign: find(['sudamerica asgnacion']),
            sudamericaTram: find(['sudamerica tramitacion']),
            reembolsosJuridico: find(['reembolsos juridico']),
            aviacionCivil: find(['aviacion civil']),
            adr: findExact(['adr']),
            normativaDot: find(['normativa dot']),
            trainJuridico: find(['train juridico']),
            tec: findExact(['tec']),
            contar: findExact(['contar']),
            peticion: findExact(['peticion']),
            vb: findExact(['vb']),

            // KPIs
            gestH: find(['gestionado/h', 'gest/h', 'exp gest/h'], ['total']),
            cerrH: find(['cerrado/h', 'cerr/h', 'exp cerr/h'], ['total']),
            ncoBO: find(['nco est. bo', 'nco bo', 'cumplimiento bo']),
            ncoCall: find(['nco est. llamadas', 'nco llam', 'nco call', 'nco_llam']),
            gestTotal: find(['total expedientes gestionados', 'exp. gest', 'total gestiones', 'gestionados', 'expedientes gestionados', 'gestiones']),
            cerrTotal: find(['total expedientes cerrados', 'exp. cerr', 'total cerrados', 'cerrados', 'expedientes cerrados']),
            adherence: find(['adherencia al puesto %', 'adherencia']),
            aht: find(['aht', 'tmo']),
            tipif: find(['% tipificacion', 'tipificación']),
            transfer: find(['transfer rate', 'transfer']),
            nps: find(['nps']),
            ncp: find(['ncp']),
            calls: find(['llamadas', 'calls'])
        };
    }

    static parseNumber(val) {
        if (val === null || val === undefined || val === '') return null;
        let str = String(val).trim();
        if (str === '-' || str === 'N/A' || str === '#DIV/0!') return null;

        if (str.includes('%')) str = str.replace('%', '');
        if (str.includes(',')) str = str.replace(',', '.');

        const num = parseFloat(str);
        return isNaN(num) ? null : num;
    }

    static normalizePercent(val) {
        const num = this.parseNumber(val);
        if (num === null) return null;
        if (num <= 1 && num > -1 && num !== 0) {
            return parseFloat((num * 100).toFixed(2));
        }
        return num;
    }

    static parseSegment(val) {
        if (!val) return null;
        let str = String(val).toUpperCase().trim();
        str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        // LOOSENED: StartWith/Includes check for common patterns
        if (str.startsWith('AGENTE JURIDICO') || str === 'JURIDICO' || str === 'LEGAL') return 'JURIDICO';
        if (str.startsWith('AGENTE ESTANDAR') || str === 'ESTANDAR' || str === 'STANDARD' || str === 'STD') return 'ESTANDAR';

        // Check includes but careful with negation (unlikely in raw data but possible)
        if (str.includes('JURIDICO') && !str.includes('NO ')) return 'JURIDICO';

        return null;
    }
}
