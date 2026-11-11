import { Component, lazy, Suspense, type ReactNode } from 'react';
type StudyToolsProps = {subjectId:string;subjectTitle:string;route:string;tabId:string};
const bankLoaders = {
  digestive: () => import('./data'),
  respiratory: () => import('./respiratory-data'),
};
const workspaces = Object.fromEntries(Object.entries(bankLoaders).map(([subjectId, load]) => [subjectId, lazy(async () => {
  const [{StudyToolsWorkspace}, {studyBank, unresolvedReferences}] = await Promise.all([import('./page'), load()]);
  return {default: (props:StudyToolsProps) => <StudyToolsWorkspace {...props} bank={studyBank} unresolvedReferences={unresolvedReferences}/>};
})]));
class StudyToolsBoundary extends Component<{children:ReactNode},{error:string}> {
  state={error:''};
  static getDerivedStateFromError(error:unknown){return{error:error instanceof Error?error.message:'Study Tools could not be loaded.'};}
  render(){return this.state.error?<section role="alert" className="learn-article-header"><h2>Study Tools could not be loaded</h2><p>{this.state.error}</p><p>The other Learn tabs are still available.</p><button type="button" onClick={()=>window.location.reload()}>Reload Study Tools</button></section>:this.props.children;}
}
export function StudyToolsLoader(props:StudyToolsProps){
  const StudyTools = workspaces[props.subjectId];
  if (!StudyTools) return <p role="alert">Study Tools are unavailable for this subject.</p>;
  return <StudyToolsBoundary key={props.subjectId}><Suspense fallback={<p role="status">Opening Study Tools…</p>}><StudyTools {...props}/></Suspense></StudyToolsBoundary>;
}
