import { Routes } from '@angular/router';
import { AccueilComponent } from './components/accueil/accueil.component';
import { MesEnfantsComponent } from './components/mes-enfants/mes-enfants.component';
import { AjouterEnfantComponent } from './components/ajouter-enfant/ajouter-enfant.component';
import { CalendrierComponent } from './components/calendrier/calendrier.component';
import { ChatComponent } from './components/chat/chat.component';
import { GererCompteComponent } from './components/gerer-compte/gerer-compte.component';
import { ConseilsComponent } from './components/conseils/conseils.component';

export const routes: Routes = [
    { path: '', redirectTo: 'accueil', pathMatch: 'full' },
    { path: 'accueil', component: AccueilComponent },
    { path: 'mes-enfants', component: MesEnfantsComponent },
    { path: 'ajouter-enfant', component: AjouterEnfantComponent },
    { path: 'modifier-enfant/:id', component: AjouterEnfantComponent },
    { path: 'calendrier', component: CalendrierComponent },
    { path: 'chat', component: ChatComponent },
    { path: 'gerer-compte', component: GererCompteComponent },
    { path: 'conseils', component: ConseilsComponent },
    { path: '**', redirectTo: 'accueil' }
];
