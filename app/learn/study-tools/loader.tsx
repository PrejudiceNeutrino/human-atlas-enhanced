import { Component, lazy, Suspense, type ReactNode } from 'react';
const StudyTools=lazy(()=>import('./page'));
class StudyToolsBoundary extends Component<{children:ReactNode},{error:string}> {
  state={error:''};
  static getDerivedStateFromError(error:unknown){return{error:error instanceof Error?error.message:'Study Tools could not be loaded.'};}
  render(){return this.state.error?<section role="alert" className="learn-article-header"><h2>Study Tools could not be loaded</h2><p>{this.state.error}</p><p>The other Learn tabs are still available.</p><button type="button" onClick={()=>window.location.reload()}>Reload Study Tools</button></section>:this.props.children;}
}
export function StudyToolsLoader(props:{subjectTitle:string;route:string;tabId:string}){
  return <StudyToolsBoundary><Suspense fallback={<p role="status">Opening Study Tools…</p>}><StudyTools {...props}/></Suspense></StudyToolsBoundary>;
}
