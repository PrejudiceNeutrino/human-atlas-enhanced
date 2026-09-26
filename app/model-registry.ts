import type {SystemId} from './anatomy';
import type {GeometrySet, Model, ModelId} from './identity-contracts';

const baseSystems = ['skeletal','sensory','nervous','connective','muscular','arterial','cardiac','endocrine','venous','digestive','respiratory','lymphatic','integumentary','reproductive','urinary'] as const satisfies readonly SystemId[];
const hraSystems = ['integumentary','sensory','nervous','muscular','pregnancy','reproductive','digestive','urinary','cardiac','arterial','venous','respiratory','lymphatic','skeletal'] as const satisfies readonly SystemId[];
const studySystems = ['skeletal','sensory','nervous','connective','muscular','arterial','cardiac','endocrine','venous','digestive','respiratory','lymphatic','urinary','mammary','integumentary','reproductive'] as const satisfies readonly SystemId[];
const sourceDerived = {status:'source-derived'} as const;

export const MODEL_REGISTRY: Record<ModelId,Model> = {
 'bp3d-male-4': {id:'bp3d-male-4',displayLabel:'Male anatomy',sex:'male',kind:'reference',manifestUrl:'/models/atlas.json',frameId:'bp3d-male-4-stage',sourceDatasetIds:['BodyParts3D-4.0'],availableSystems:baseSystems,geometrySetIds:['atlas:geometry:bp3d-male-4'],mappingRevision:'core-crosswalk-v1',review:sourceDerived,experimental:false,route:'/male'},
 'hra-female-v1.5': {id:'hra-female-v1.5',displayLabel:'HRA female reference',sex:'female',kind:'reference',manifestUrl:'/models/atlas-female.json',frameId:'hra-female-v1.5-stage',sourceDatasetIds:['HRA-united-female-v1.5'],availableSystems:hraSystems,geometrySetIds:['atlas:geometry:hra-female-v1.5'],mappingRevision:'core-crosswalk-v1',review:sourceDerived,experimental:false,route:null},
 'female-study-v3': {id:'female-study-v3',displayLabel:'Female study model',sex:'female',kind:'study',manifestUrl:'/models/atlas-female-reconstructed.json',frameId:'female-study-v3-stage',sourceDatasetIds:['BodyParts3D-4.0','HRA-united-female-v1.5'],availableSystems:studySystems,geometrySetIds:['atlas:geometry:female-study-v3'],mappingRevision:'core-crosswalk-v1',review:{status:'unresolved',note:'Experimental placement and independent anatomical review remain unresolved.'},experimental:true,route:'/female'},
};

export const GEOMETRY_SETS: Record<GeometrySet['id'],GeometrySet> = {
 'atlas:geometry:bp3d-male-4': {id:'atlas:geometry:bp3d-male-4',modelId:'bp3d-male-4',frameId:'bp3d-male-4-stage',sourceDatasetIds:['BodyParts3D-4.0'],fidelity:'source-derived',licenseIds:['CC-BY-4.0'],review:sourceDerived},
 'atlas:geometry:hra-female-v1.5': {id:'atlas:geometry:hra-female-v1.5',modelId:'hra-female-v1.5',frameId:'hra-female-v1.5-stage',sourceDatasetIds:['HRA-united-female-v1.5'],fidelity:'source-derived',licenseIds:['CC-BY-4.0'],review:sourceDerived},
 'atlas:geometry:female-study-v3': {id:'atlas:geometry:female-study-v3',modelId:'female-study-v3',frameId:'female-study-v3-stage',sourceDatasetIds:['BodyParts3D-4.0','HRA-united-female-v1.5'],fidelity:'adapted-study',licenseIds:['CC-BY-4.0'],review:{status:'unresolved',note:'Experimental geometry placement; see female readiness report.'}},
};

/** Legacy route/selector names stay at the boundary; internal code uses stable IDs. */
export type ViewerModel = 'male'|'female'|'female-reference';
export const VIEWER_MODEL_IDS: Record<ViewerModel,ModelId> = {'male':'bp3d-male-4','female':'female-study-v3','female-reference':'hra-female-v1.5'};
export function modelForViewer(value:ViewerModel):Model {return MODEL_REGISTRY[VIEWER_MODEL_IDS[value]];}
export function modelForRoute(pathname:string):Model|null {return Object.values(MODEL_REGISTRY).find(model=>model.route===pathname)??null;}
export function assertModelRegistry():void {
 for(const [key,model] of Object.entries(MODEL_REGISTRY)){
  if(key!==model.id||!model.manifestUrl.startsWith('/models/')||!model.frameId||!model.sourceDatasetIds.length||!model.geometrySetIds.length||!model.mappingRevision)throw new Error(`Invalid model registry record: ${key}`);
  if(model.kind==='study'&&!model.experimental)throw new Error(`Study model must be marked experimental: ${key}`);
  for(const geometrySetId of model.geometrySetIds){const set=GEOMETRY_SETS[geometrySetId];if(!set||set.modelId!==model.id||set.frameId!==model.frameId)throw new Error(`Invalid geometry set ${geometrySetId} for ${key}`);}
 }
}
