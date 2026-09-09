FONDEG CATERING CONGO SA
Alerte de prix — Différences détectées
================================================

Des différences de prix ont été détectées lors de la création du bon de commande :

@foreach($alertes as $a)
  - {{ $a['produit'] }}: dernier prix {{ $a['ancien'] }} → nouveau {{ $a['nouveau'] }} ({{ $a['difference'] }})
@endforeach

Bon de commande : {{ $numeroCommande }}
Fournisseur : {{ $fournisseur }}
Date : {{ $dateCommande }}

---
FONDEG CATERING CONGO SA — Système GST
