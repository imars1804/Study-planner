// app.js (Código Completo y Modular de Firebase)

// =======================================================================
// 1. IMPORTACIONES MODULARES DE FIREBASE
// =======================================================================

// Importamos las funciones específicas que necesitamos de Auth y Firestore
import { 
    GoogleAuthProvider, 
    signInWithPopup, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

import { 
    collection, 
    doc, 
    getDoc, 
    setDoc 
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";


// =======================================================================
// 2. BASE DE DATOS DE MATERIAS (Malla Abogacía UADE)
// =======================================================================

const curriculum = [
    // Año 1
    { id: 'h_der', nombre: 'Historia del Derecho', year: 1, correlativas: [] },
    { id: 'inst_prv1', nombre: 'Instituciones de Derecho Privado 1', year: 1, correlativas: [] },
    { id: 'tg_der', nombre: 'Teoría General del Derecho', year: 1, correlativas: [] },
    { id: 'est_soc', nombre: 'Estado y Sociedad', year: 1, correlativas: [] },
    { id: 'leng_log', nombre: 'Lenguaje, Lógica y Argumentación', year: 1, correlativas: [] },
    { id: 'fil_eti', nombre: 'Filosofía y Ética', year: 1, correlativas: [] },
    { id: 'intro_sj', nombre: 'Introducción a los Sistemas Jurídicos', year: 1, correlativas: [] },
    { id: 'der_const', nombre: 'Derecho Constitucional', year: 1, correlativas: [] },
    { id: 'inst_prv2', nombre: 'Instituciones de Derecho Privado 2', year: 1, correlativas: ['inst_prv1'] }, // Correlativa 1 -> 2
    { id: 'der_pen1', nombre: 'Derecho Penal 1', year: 1, correlativas: [] },

    // Año 2
    { id: 'tg_obl', nombre: 'Teoría General de las Obligaciones', year: 2, correlativas: ['inst_prv2'] }, // Asumimos correlatividad lógica
    { id: 'dh', nombre: 'Derechos Humanos', year: 2, correlativas: ['der_const'] }, 
    { id: 'dip', nombre: 'Derecho Internacional Público', year: 2, correlativas: ['der_const'] },
    { id: 'der_pen2', nombre: 'Derecho Penal 2', year: 2, correlativas: ['der_pen1'] }, // Correlativa 1 -> 2
    { id: 'dpc', nombre: 'Derecho Procesal, Civil y Comercial', year: 2, correlativas: ['tg_obl'] }, 
    { id: 'ingles', nombre: 'Inglés', year: 2, correlativas: [] }, 
    { id: 'der_danos', nombre: 'Derecho de Daños', year: 2, correlativas: ['tg_obl'] }, 
    { id: 'p_e_proc', nombre: 'Práctica y Estrategia Procesal', year: 2, correlativas: ['dpc'] }, 
    { id: 'der_ts_ss', nombre: 'Der. del Trabajo y de la Seg. Social', year: 2, correlativas: [] },
    { id: 'der_pp', nombre: 'Derecho Procesal Penal', year: 2, correlativas: ['der_pen2'] },

    // Año 3
    { id: 'tg_contr', nombre: 'Teoría General de los Contratos', year: 3, correlativas: ['tg_obl'] },
    { id: 'pers_jp', nombre: 'Personas Jurídicas Privadas', year: 3, correlativas: ['inst_prv2'] },
    { id: 'fil_der', nombre: 'Filosofía del Derecho', year: 3, correlativas: ['fil_eti'] },
    { id: 'der_adm', nombre: 'Derecho Administrativo', year: 3, correlativas: ['der_const'] },
    { id: 'der_reales', nombre: 'Derechos Reales', year: 3, correlativas: ['pers_jp', 'inst_prv2'] }, 
    { id: 'met_ij', nombre: 'Metodología de la Investigación Jurídica', year: 3, correlativas: [] }, // Materia de corte para el Título
    { id: 'tv_conc', nombre: 'Títulos Valores y Concursos', year: 3, correlativas: ['tg_contr'] },
    { id: 'contr_cc', nombre: 'Contratos Civiles y Comerciales', year: 3, correlativas: ['tg_contr'] },
    { id: 'der_fy_t', nombre: 'Der. Financiero y Tributario', year: 3, correlativas: ['der_adm'] }, 
    { id: 'eco_a_der', nombre: 'Economía y Análisis Económico del Derecho', year: 3, correlativas: [] },

    // Año 4
    { id: 'res_cont', nombre: 'Resolución de Controversias', year: 4, correlativas: [] },
    { id: 'der_fam', nombre: 'Derecho de Familia', year: 4, correlativas: ['der_reales'] },
    { id: 'der_i_pi', nombre: 'Der. Informático y de la Propiedad Intelectual', year: 4, correlativas: [] },
    { id: 'der_int_p', nombre: 'Derecho Internacional Privado', year: 4, correlativas: ['dip'] },
    { id: 'der_amb', nombre: 'Der. Ambiental y de los Recursos Naturales', year: 4, correlativas: [] },
    { id: 'der_cons', nombre: 'Derecho del Consumidor', year: 4, correlativas: ['tg_contr'] },
    { id: 'der_a_n_a', nombre: 'Der. Aduanero, de la Navegación y Aeronáutico', year: 4, correlativas: [] },
    { id: 'der_sucesiones', nombre: 'Derecho de Sucesiones', year: 4, correlativas: ['der_fam'] }, 
    { id: 'p_e_prof', nombre: 'Práctica y Ética Profesional', year: 4, correlativas: ['met_ij'] }, 
    { id: 'ti_final', nombre: 'Trabajo de Integración Final', year: 4, correlativas: ['p_e_prof'] },
];

// Variables globales de estado
let approvedSubjects = new Set();
let userId = null;

// INSTANCIAS DE FIREBASE (Se inicializarán en window.onload, después de index.html)
let auth;
let db;

// =======================================================================
// 3. FUNCIONES DE LÓGICA DE LA MALLA
// =======================================================================

function renderCurriculum() {
    // 1. Limpia los contenedores
    document.querySelectorAll('.year-block').forEach(el => el.innerHTML = '');

    // 2. Dibuja las materias
    curriculum.forEach(subject => {
        const isApproved = approvedSubjects.has(subject.id);
        const isBlocked = !isSubjectAvailable(subject.id);

        const card = document.createElement('div');
        card.className = `materia-card ${isApproved ? 'aprobada' : ''} ${isBlocked ? 'bloqueada' : ''}`;
        card.id = subject.id;
        card.textContent = subject.nombre;
        
        // 3. Define los listeners de Clic (Aprobar) y Doble Clic (Destachar)
        card.addEventListener('click', () => handleSubjectClick(subject.id));
        card.addEventListener('dblclick', () => handleSubjectDblClick(subject.id));

        document.getElementById(`year-${subject.year}`).appendChild(card);
    });
    
    // 4. Actualiza el Título Intermedio
    checkIntermediateTitle();
}

function isSubjectAvailable(subjectId) {
    const subject = curriculum.find(s => s.id === subjectId);
    if (!subject) return false;

    // Si no hay correlativas, está disponible.
    if (subject.correlativas.length === 0) return true;

    // Está disponible si todas sus correlativas están aprobadas
    return subject.correlativas.every(corrId => approvedSubjects.has(corrId));
}

// Clic simple: Aprobar
function handleSubjectClick(subjectId) {
    if (!userId) {
        alert('Debes iniciar sesión con Google para guardar tu progreso.');
        return;
    }
    
    // Si la materia está bloqueada
    if (!isSubjectAvailable(subjectId) && !approvedSubjects.has(subjectId)) {
        alert('Esta materia está bloqueada. Debes aprobar sus correlativas primero.');
        return;
    }

    // Si no está aprobada, la aprueba
    if (!approvedSubjects.has(subjectId)) {
        approvedSubjects.add(subjectId);
        saveProgress();
        renderCurriculum(); 
    }
}

// Doble clic: Destachar/Desaprobar
function handleSubjectDblClick(subjectId) {
    if (!userId) {
        alert('Debes iniciar sesión.');
        return;
    }

    if (approvedSubjects.has(subjectId)) {
        // Verifica si otras materias aprobadas dependen de esta
        const dependentSubjects = curriculum.filter(s => s.correlativas.includes(subjectId));
        const approvedDependents = dependentSubjects.filter(s => approvedSubjects.has(s.id));

        if (approvedDependents.length > 0) {
             const dependentNames = approvedDependents.map(s => s.nombre).join(', ');
             const confirmDestach = confirm(`ADVERTENCIA: Las siguientes materias dependen de esta y serán deshabilitadas: ${dependentNames}. ¿Seguro que quieres destacharla?`);
             if (!confirmDestach) return;
             
             // Desaprueba las dependientes también
             approvedDependents.forEach(s => approvedSubjects.delete(s.id));
        }

        approvedSubjects.delete(subjectId);
        saveProgress();
        renderCurriculum(); 
    }
}

function checkIntermediateTitle() {
    // Materias requeridas para el Título Intermedio (asumo todas las de Años 1 y 2, más las del primer cuatrimestre de 3, incluyendo Metodología de la Investigación Jurídica)
    const titleSubjectsIds = [
        'h_der', 'inst_prv1', 'tg_der', 'est_soc', 'leng_log', 'fil_eti', 'intro_sj', 'der_const', 'inst_prv2', 'der_pen1',
        'tg_obl', 'dh', 'dip', 'der_pen2', 'dpc', 'ingles', 'der_danos', 'p_e_proc', 'der_ts_ss', 'der_pp',
        'tg_contr', 'pers_jp', 'fil_der', 'der_adm', 'der_reales', 'met_ij' // Materias clave del Tercer Año
    ];
    
    const isComplete = titleSubjectsIds.every(id => approvedSubjects.has(id));
    const titleBlock = document.querySelector('.title-intermedio');
    const titleStatus = document.getElementById('title-status');

    if (isComplete) {
        titleBlock.classList.add('complete');
        titleStatus.textContent = '¡CONSEGUIDO!';
    } else {
        titleBlock.classList.remove('complete');
        titleStatus.textContent = 'Pendiente';
    }
}


// =======================================================================
// 4. LÓGICA FIREBASE (Autenticación y DB)
// =======================================================================

// Lógica de Autenticación de Google
document.getElementById('google-login-btn').addEventListener('click', () => {
    if (!auth || !db) {
        // Obtenemos las instancias globales de window que fueron inicializadas en index.html
        auth = window.auth;
        db = window.db;
    }
    
    if (!auth) return alert('Error al cargar Firebase Auth. Revisa la configuración en index.html.');
    
    const provider = new GoogleAuthProvider();
    
    signInWithPopup(auth, provider) 
        .catch(error => {
            console.error("Error de login:", error);
            alert("Hubo un error al iniciar sesión.");
        });
});

// Cargar el progreso del usuario desde Firestore
async function loadProgress(uid) {
    if (!db) return console.error('Firestore no inicializado.');
    try {
        const userDocRef = doc(db, 'users', uid);
        const docSnap = await getDoc(userDocRef);
        
        if (docSnap.exists() && docSnap.data().approved) {
            // Aseguramos que solo cargamos el progreso si el documento existe
            approvedSubjects = new Set(docSnap.data().approved);
        } else {
            approvedSubjects.clear();
        }
        renderCurriculum();
    } catch (error) {
        console.error("Error al cargar el progreso:", error);
    }
}

// Guardar el progreso del usuario en Firestore
function saveProgress() {
    if (!userId || !db) return;

    const approvedArray = Array.from(approvedSubjects);
    
    setDoc(doc(db, 'users', userId), {
        approved: approvedArray
    })
    .catch((error) => {
        console.error("Error al guardar el progreso:", error);
    });
}


// =======================================================================
// 5. INICIALIZACIÓN (Se llama al cargar la página)
// =======================================================================

window.onload = () => {
    // Obtenemos las instancias de Firebase después de que index.html las inicializa
    auth = window.auth;
    db = window.db;

    // Configuramos el listener de autenticación para que reaccione al estado de login
    if (auth) {
        onAuthStateChanged(auth, (user) => {
            const loginBtn = document.getElementById('google-login-btn');
            const userInfo = document.getElementById('user-info');
            
            if (user) {
                // Logueado: Carga progreso
                userId = user.uid;
                loginBtn.style.display = 'none';
                userInfo.style.display = 'block';
                userInfo.textContent = `Bienvenida, ${user.displayName.split(' ')[0]}!`;
                loadProgress(userId); 
            } else {
                // Deslogueado: Resetea y dibuja la malla vacía
                userId = null;
                approvedSubjects.clear();
                loginBtn.style.display = 'block';
                userInfo.style.display = 'none';
                renderCurriculum(); 
            }
        });
    }

    // Aseguramos que la malla se dibuje incluso sin loguearse (estará vacía)
    renderCurriculum();
};
